using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BE_QLKH.Hubs;

[Authorize]
public class NotificationsHub : Hub
{
    public override Task OnConnectedAsync()
    {
        var legacyId = Context.User?.FindFirst("legacy_id")?.Value;
        if (legacyId != null)
        {
            Groups.AddToGroupAsync(Context.ConnectionId, legacyId);
        }
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var legacyId = Context.User?.FindFirst("legacy_id")?.Value;
        if (legacyId != null)
        {
            Groups.RemoveFromGroupAsync(Context.ConnectionId, legacyId);
        }
        return base.OnDisconnectedAsync(exception);
    }
}
