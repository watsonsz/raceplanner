namespace Planner.Data;

public static class RoomLogic
{
    public static int BlockCount(DateTimeOffset startUtc, DateTimeOffset endUtc, int intervalMinutes)
    {
        if (intervalMinutes <= 0) intervalMinutes = 60;
        var totalMinutes = (endUtc - startUtc).TotalMinutes;
        return Math.Max(1, (int)Math.Ceiling(totalMinutes / intervalMinutes));
    }

    public static bool[] EmptySlots(int blocks) => Enumerable.Repeat(false, blocks).ToArray();

    public static string NormalizeGroup(string group)
        => (group ?? "").Trim().ToLowerInvariant() switch
        {
            "drivers" => "drivers",
            "driver" => "drivers",
            "pitcrew" => "pitcrew",
            "pit crew" => "pitcrew",
            "crew" => "pitcrew",
            _ => (group ?? "").Trim().ToLowerInvariant()
        };

    public static string NewRoomCode()
    {
        const string chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        return new string(Enumerable.Range(0, 6).Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
    }

    public static string RandomColor()
    {
        var rnd = Random.Shared.Next(0x404040, 0xFFFFFF);
        return $"#{rnd:X6}";
    }
}
