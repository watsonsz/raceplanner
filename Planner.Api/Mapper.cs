using Planner.Data;

namespace Planner.Api;

public static class Mapper
{
    public static RoomSummaryDto ToRoomSummary(RaceRoom r)
        => new(
            r.Code,
            r.RaceName,
            r.TeamName,
            r.StartUtc,
            r.EndUtc,
            r.IntervalMinutes,
            PlannerJson.ThemeFromJson(r.ThemeJson)
        );

    public static PersonScheduleDto ToPersonDto(PersonScheduleEntity p)
        => new(
            p.PersonId,
            p.Name,
            p.Color,
            PlannerJson.SlotsFromJson(p.SlotsJson)
        );

    public static VehicleDto ToVehicleDto(Vehicle v)
        => new(v.Id, v.Name);

    public static DriverVehicleProficiencyDto ToProficiencyDto(DriverVehicleProficiency p)
        => new(
            p.PersonId,
            p.VehicleId,
            p.Rating.ToString()
        );

    public static ScheduleEntryDto ToScheduleDto(ScheduleEntry s)
        => new(
            s.BlockIndex,
            s.Role,
            s.PersonId,
            s.VehicleId
        );
}
