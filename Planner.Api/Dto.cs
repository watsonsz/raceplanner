using Planner.Data;

namespace Planner.Api;

public record CreateRoomRequest(
    string RaceName,
    string TeamName,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    int IntervalMinutes,
    RoomTheme Theme,
    List<string> Vehicles
);

public record VehicleDto(int Id, string Name);

public record DriverVehicleProficiencyDto(
    string PersonId,
    int VehicleId,
    string Rating
);

public record ScheduleEntryDto(
    int BlockIndex,
    string Role,
    string PersonId,
    int? VehicleId
);

public record UpdateProficienciesRequest(
    List<DriverVehicleProficiencyDto> Proficiencies
);

public record UpdateScheduleRequest(
    List<ScheduleEntryDto> Schedule
);

public record RoomSummaryDto(
    string Code,
    string RaceName,
    string TeamName,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    int IntervalMinutes,
    RoomTheme Theme
);

public record PersonScheduleDto(
    string Id,
    string Name,
    string Color,
    bool[] Slots
);

public record RoomStateDto(
    RoomSummaryDto Room,
    List<PersonScheduleDto> Drivers,
    List<PersonScheduleDto> PitCrew,
    List<VehicleDto> Vehicles,
    List<DriverVehicleProficiencyDto> Proficiencies,
    List<ScheduleEntryDto> Schedule
);

public record AddPersonRequest(
    string Group,
    string Name,
    string? Color
);

public record UpdatePersonRequest(
    string Group,
    string Id,
    string Name,
    string Color,
    bool[] Slots
);

public record UpdateThemeRequest(RoomTheme Theme);
