using System.ComponentModel.DataAnnotations;

namespace Planner.Data;


public class Vehicle
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public RaceRoom Room { get; set; } = default!;
    public string Name { get; set; } = default!;
}

public enum ProficiencyRating
{
    Bad = 0,
    Passable = 1,
    Proficient = 2
}

public class DriverVehicleProficiency
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public RaceRoom Room { get; set; } = default!;

    public string PersonId { get; set; } = default!;
    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; } = default!;

    public ProficiencyRating Rating { get; set; }
}

public class ScheduleEntry
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public RaceRoom Room { get; set; } = default!;

    public int BlockIndex { get; set; }

    // "driver" | "pitcrew"
    public string Role { get; set; } = default!;

    public string PersonId { get; set; } = default!;
    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
}

public class RaceRoom
{
    public int Id { get; set; }

    [Required, MaxLength(12)]
    public string Code { get; set; } = default!; // join code like K4J9Q2

    [Required, MaxLength(120)]
    public string RaceName { get; set; } = default!;

    [Required, MaxLength(120)]
    public string TeamName { get; set; } = default!;

    // Stored in UTC
    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset EndUtc { get; set; }

    public int IntervalMinutes { get; set; } = 60;

    // JSON theme tokens
    [Required]
    public string ThemeJson { get; set; } = default!;

    public DateTimeOffset CreatedUtc { get; set; } = DateTimeOffset.UtcNow;

    // NEW: daylight tracking
    public bool TrackDaylightConditions { get; set; }

    [MaxLength(16)]
    public string? RaceStartCondition { get; set; } // "day" | "night"

    public int? TimeUntilTransitionMinutes { get; set; }
    public int? LengthOfDayMinutes { get; set; }
    public int? LengthOfNightMinutes { get; set; }

    public List<PersonScheduleEntity> People { get; set; } = new();
    public List<Vehicle> Vehicles { get; set; } = new();
    public List<DriverVehicleProficiency> Proficiencies { get; set; } = new();
    public List<ScheduleEntry> ScheduleEntries { get; set; } = new();
}

public class PersonScheduleEntity
{
    public int Id { get; set; }

    public int RoomId { get; set; }
    public RaceRoom Room { get; set; } = default!;

    // "drivers" | "pitcrew"
    [Required, MaxLength(16)]
    public string Group { get; set; } = default!;

    // stable id used by UI
    [Required, MaxLength(64)]
    public string PersonId { get; set; } = default!;

    [Required, MaxLength(120)]
    public string Name { get; set; } = default!;

    [Required, MaxLength(16)]
    public string Color { get; set; } = default!;

    // JSON bool[] (length depends on interval + duration)
    [Required]
    public string SlotsJson { get; set; } = default!;
}

public record RoomTheme(
    string Background,
    string Panel,
    string Text,
    string Border,
    string Accent
);
