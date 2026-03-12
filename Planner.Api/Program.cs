using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Planner.Api;
using Microsoft.EntityFrameworkCore;
using Planner.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PlannerDb>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("PlannerDb");
    opt.UseSqlite(cs);
});

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            // Vite dev server default
            .SetIsOriginAllowed(origin => origin.StartsWith("http://localhost:")));
});

var app = builder.Build();

app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PlannerDb>();
    db.Database.Migrate();
}
// --- API ---
//
app.MapGet("/api/ping", () => Results.Json(new { ok = true, ts = DateTimeOffset.UtcNow }));
app.MapPost("/api/rooms", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    [FromBody] CreateRoomRequest req) =>
{
    var validation = ValidateCreate(req);
    if (validation is not null) return validation;

    string code;
    do
    {
        code = RoomLogic.NewRoomCode();
    } while (await db.Rooms.AnyAsync(r => r.Code == code));

    var room = new RaceRoom
    {
        Code = code,
        RaceName = req.RaceName.Trim(),
        TeamName = req.TeamName.Trim(),
        StartUtc = req.StartUtc.ToUniversalTime(),
        EndUtc = req.EndUtc.ToUniversalTime(),
        IntervalMinutes = req.IntervalMinutes,
        ThemeJson = PlannerJson.ThemeToJson(req.Theme),
        CreatedUtc = DateTimeOffset.UtcNow
    };

    db.Rooms.Add(room);
    await db.SaveChangesAsync();

    var vehicleNames = (req.Vehicles ?? new List<string>())
        .Select(v => v.Trim())
        .Where(v => !string.IsNullOrWhiteSpace(v))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

    if (vehicleNames.Count > 0)
    {
        db.Vehicles.AddRange(vehicleNames.Select(v => new Vehicle
        {
            RoomId = room.Id,
            Name = v
        }));

        await db.SaveChangesAsync();
    }

    var state = await LoadRoomState(db, code);
    return Results.Json(state);
});
static async Task<RoomStateDto?> LoadRoomState(PlannerDb db, string code)
{
    code = code.Trim().ToUpperInvariant();

    var room = await db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return null;

    var people = await db.People.AsNoTracking()
        .Where(p => p.RoomId == room.Id)
        .ToListAsync();

    var vehicles = await db.Vehicles.AsNoTracking()
        .Where(v => v.RoomId == room.Id)
        .OrderBy(v => v.Id)
        .ToListAsync();

    var proficiencies = await db.Proficiencies.AsNoTracking()
        .Where(p => p.RoomId == room.Id)
        .ToListAsync();

    var schedule = await db.ScheduleEntries.AsNoTracking()
        .Where(s => s.RoomId == room.Id)
        .OrderBy(s => s.BlockIndex)
        .ThenBy(s => s.Role)
        .ToListAsync();

    var drivers = people.Where(p => p.Group == "drivers").Select(Mapper.ToPersonDto).ToList();
    var pit = people.Where(p => p.Group == "pitcrew").Select(Mapper.ToPersonDto).ToList();

    return new RoomStateDto(
        Mapper.ToRoomSummary(room),
        drivers,
        pit,
        vehicles.Select(Mapper.ToVehicleDto).ToList(),
        proficiencies.Select(Mapper.ToProficiencyDto).ToList(),
        schedule.Select(Mapper.ToScheduleDto).ToList()
    );
}
static async Task BroadcastRoom(
    IHubContext<PlannerHub> hub,
    PlannerDb db,
    string code)
{
    var state = await LoadRoomState(db, code);
    if (state is null) return;

    await hub.Clients.Group($"room:{code.Trim().ToUpperInvariant()}")
        .SendAsync("StateUpdated", state);
}

static IResult? ValidateCreate(CreateRoomRequest req)
{
    if (string.IsNullOrWhiteSpace(req.RaceName)) return Results.BadRequest("RaceName required.");
    if (string.IsNullOrWhiteSpace(req.TeamName)) return Results.BadRequest("TeamName required.");
    if (req.IntervalMinutes <= 0) return Results.BadRequest("IntervalMinutes must be > 0.");
    if (req.EndUtc <= req.StartUtc) return Results.BadRequest("EndUtc must be after StartUtc.");

    var durationHours = (req.EndUtc - req.StartUtc).TotalHours;
    if (durationHours <= 0.1) return Results.BadRequest("Race duration too short.");
    if (durationHours > 72) return Results.BadRequest("Race duration too long (cap 72h).");

    return null; // ✅ valid
}
// POST /api/rooms -> create room

// GET /api/rooms/{code} -> room state
app.MapGet("/api/rooms/{code}", async (PlannerDb db, string code) =>
{
    var state = await LoadRoomState(db, code);
    return state is null ? Results.NotFound() : Results.Ok(state);
});

// PUT /api/rooms/{code}/theme -> update theme (persist + broadcast)
app.MapPut("/api/rooms/{code}/theme", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    string code,
    [FromBody] UpdateThemeRequest req) =>
{
    code = code.Trim().ToUpperInvariant();
    var room = await db.Rooms.FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return Results.NotFound();

    room.ThemeJson = PlannerJson.ThemeToJson(req.Theme);
    await db.SaveChangesAsync();

    await BroadcastRoom(hub, db, code);
    return Results.Ok(await LoadRoomState(db, code));
});

// POST /api/rooms/{code}/people -> add driver/crew row
app.MapPost("/api/rooms/{code}/people", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    string code,
    [FromBody] AddPersonRequest req) =>
{
    code = code.Trim().ToUpperInvariant();
    var group = RoomLogic.NormalizeGroup(req.Group);
    if (group is not ("drivers" or "pitcrew")) return Results.BadRequest("Group must be drivers or pitcrew.");
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest("Name required.");

    var room = await db.Rooms.FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return Results.NotFound();

    var blocks = RoomLogic.BlockCount(room.StartUtc, room.EndUtc, room.IntervalMinutes);
    var slots = RoomLogic.EmptySlots(blocks);

    var entity = new PersonScheduleEntity
    {
        RoomId = room.Id,
        Group = group,
        PersonId = Guid.NewGuid().ToString("N"),
        Name = req.Name.Trim(),
        Color = string.IsNullOrWhiteSpace(req.Color) ? RoomLogic.RandomColor() : req.Color!.Trim(),
        SlotsJson = PlannerJson.SlotsToJson(slots)
    };

    db.People.Add(entity);
    await db.SaveChangesAsync();

    await BroadcastRoom(hub, db, code);
    return Results.Ok(await LoadRoomState(db, code));
});

// PUT /api/rooms/{code}/people -> update person (name/color/slots)
app.MapPut("/api/rooms/{code}/people", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    string code,
    [FromBody] UpdatePersonRequest req) =>
{
    code = code.Trim().ToUpperInvariant();
    var group = RoomLogic.NormalizeGroup(req.Group);
    if (group is not ("drivers" or "pitcrew")) return Results.BadRequest("Group must be drivers or pitcrew.");
    if (string.IsNullOrWhiteSpace(req.Id)) return Results.BadRequest("Id required.");
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest("Name required.");
    if (req.Slots is null) return Results.BadRequest("Slots required.");

    var room = await db.Rooms.FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return Results.NotFound();

    var blocks = RoomLogic.BlockCount(room.StartUtc, room.EndUtc, room.IntervalMinutes);
    if (req.Slots.Length != blocks)
        return Results.BadRequest($"Slots length must be {blocks} for this room.");

    var entity = await db.People.FirstOrDefaultAsync(p =>
        p.RoomId == room.Id &&
        p.Group == group &&
        p.PersonId == req.Id);

    if (entity is null) return Results.NotFound();

    entity.Name = req.Name.Trim();
    entity.Color = req.Color.Trim();
    entity.SlotsJson = PlannerJson.SlotsToJson(req.Slots);

    await db.SaveChangesAsync();

    await BroadcastRoom(hub, db, code);
    return Results.Ok(await LoadRoomState(db, code));
});

// DELETE /api/rooms/{code}/people/{group}/{id} -> delete row
app.MapDelete("/api/rooms/{code}/people/{group}/{id}", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    string code,
    string group,
    string id) =>
{
    code = code.Trim().ToUpperInvariant();
    group = RoomLogic.NormalizeGroup(group);

    var room = await db.Rooms.FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return Results.NotFound();

    var entity = await db.People.FirstOrDefaultAsync(p =>
        p.RoomId == room.Id &&
        p.Group == group &&
        p.PersonId == id);

    if (entity is null) return Results.NotFound();

    db.People.Remove(entity);
    await db.SaveChangesAsync();

    await BroadcastRoom(hub, db, code);
    return Results.Ok(await LoadRoomState(db, code));
});

app.MapPut("/api/rooms/{code}/proficiencies", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    string code,
    [FromBody] UpdateProficienciesRequest req) =>
{
    code = code.Trim().ToUpperInvariant();

    var room = await db.Rooms.FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return Results.NotFound();

    var vehicles = await db.Vehicles
        .Where(v => v.RoomId == room.Id)
        .Select(v => v.Id)
        .ToHashSetAsync();

    var drivers = await db.People
        .Where(p => p.RoomId == room.Id && p.Group == "drivers")
        .Select(p => p.PersonId)
        .ToHashSetAsync();

    db.Proficiencies.RemoveRange(db.Proficiencies.Where(p => p.RoomId == room.Id));

    var incoming = (req.Proficiencies ?? new List<DriverVehicleProficiencyDto>())
        .Where(p => drivers.Contains(p.PersonId) && vehicles.Contains(p.VehicleId))
        .Select(p => new DriverVehicleProficiency
        {
            RoomId = room.Id,
            PersonId = p.PersonId,
            VehicleId = p.VehicleId,
            Rating = Enum.TryParse<ProficiencyRating>(p.Rating, true, out var rating)
                ? rating
                : ProficiencyRating.Passable
        })
        .ToList();

    if (incoming.Count > 0)
        db.Proficiencies.AddRange(incoming);

    await db.SaveChangesAsync();
    await BroadcastRoom(hub, db, code);

    return Results.Ok(await LoadRoomState(db, code));
});

app.MapPut("/api/rooms/{code}/schedule", async (
    PlannerDb db,
    IHubContext<PlannerHub> hub,
    string code,
    [FromBody] UpdateScheduleRequest req) =>
{
    code = code.Trim().ToUpperInvariant();

    var room = await db.Rooms.FirstOrDefaultAsync(r => r.Code == code);
    if (room is null) return Results.NotFound();

    var maxBlocks = RoomLogic.BlockCount(room.StartUtc, room.EndUtc, room.IntervalMinutes);

    var drivers = await db.People
        .Where(p => p.RoomId == room.Id && p.Group == "drivers")
        .Select(p => p.PersonId)
        .ToHashSetAsync();

    var crew = await db.People
        .Where(p => p.RoomId == room.Id && p.Group == "pitcrew")
        .Select(p => p.PersonId)
        .ToHashSetAsync();

    var vehicles = await db.Vehicles
        .Where(v => v.RoomId == room.Id)
        .Select(v => v.Id)
        .ToHashSetAsync();

    db.ScheduleEntries.RemoveRange(db.ScheduleEntries.Where(s => s.RoomId == room.Id));

    var incoming = new List<ScheduleEntry>();

    foreach (var s in req.Schedule ?? new List<ScheduleEntryDto>())
    {
        if (s.BlockIndex < 0 || s.BlockIndex >= maxBlocks) continue;
        if (s.Role is not ("driver" or "pitcrew")) continue;

        if (s.Role == "driver")
        {
            if (!drivers.Contains(s.PersonId)) continue;
            if (s.VehicleId.HasValue && !vehicles.Contains(s.VehicleId.Value)) continue;
        }
        else
        {
            if (!crew.Contains(s.PersonId)) continue;
        }

        incoming.Add(new ScheduleEntry
        {
            RoomId = room.Id,
            BlockIndex = s.BlockIndex,
            Role = s.Role,
            PersonId = s.PersonId,
            VehicleId = s.Role == "driver" ? s.VehicleId : null
        });
    }

    if (incoming.Count > 0)
        db.ScheduleEntries.AddRange(incoming);

    await db.SaveChangesAsync();
    await BroadcastRoom(hub, db, code);

    return Results.Ok(await LoadRoomState(db, code));
});
app.MapGet("/api/rooms", async (PlannerDb db) =>
{
    var rooms = await db.Rooms
        .AsNoTracking()
        .ToListAsync();

    var result = rooms
        .OrderByDescending(r => r.CreatedUtc)
        .Select(r => new RoomSummaryDto(
            r.Code,
            r.RaceName,
            r.TeamName,
            r.StartUtc,
            r.EndUtc,
            r.IntervalMinutes,
            PlannerJson.ThemeFromJson(r.ThemeJson)
        ))
        .ToList();

    return Results.Json(result);
});
// --- SignalR ---
app.MapHub<PlannerHub>("/plannerHub");

app.MapGet("/", () => "Planner API running");

app.Run();
