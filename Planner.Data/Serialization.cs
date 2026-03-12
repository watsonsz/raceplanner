using System.Text.Json;

namespace Planner.Data;

public static class PlannerJson
{
    public static readonly JsonSerializerOptions Opts = new(JsonSerializerDefaults.Web);

    public static string ThemeToJson(RoomTheme theme) => JsonSerializer.Serialize(theme, Opts);
    public static RoomTheme ThemeFromJson(string json)
        => JsonSerializer.Deserialize<RoomTheme>(json, Opts)
           ?? new RoomTheme("#0b0b0b", "#0f0f0f", "#ffffff", "#222222", "#ff6b6b");

    public static string SlotsToJson(bool[] slots) => JsonSerializer.Serialize(slots, Opts);
    public static bool[] SlotsFromJson(string json)
        => JsonSerializer.Deserialize<bool[]>(json, Opts) ?? Array.Empty<bool>();
}
