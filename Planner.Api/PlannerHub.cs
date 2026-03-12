using Microsoft.AspNetCore.SignalR;

namespace Planner.Api;

public class PlannerHub : Hub
{
       public async Task JoinRoom(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;

        code = code.Trim().ToUpperInvariant();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"room:{code}");
    }

    // Optional: allow leaving
    public async Task LeaveRoom(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;

        code = code.Trim().ToUpperInvariant();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room:{code}");
    } 
}
