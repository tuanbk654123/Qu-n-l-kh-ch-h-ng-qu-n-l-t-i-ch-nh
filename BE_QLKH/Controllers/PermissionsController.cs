using BE_QLKH.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE_QLKH.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    [Authorize(Roles = "admin,ceo")]
    public async Task<ActionResult<object>> GetPermissions()
    {
        var matrix = await _permissionService.GetPermissionMatrixAsync();

        return Ok(new
        {
            roles = matrix.Roles.Select(r => new { key = r.Key, label = r.Label }),
            permissions = new
            {
                qlkh = matrix.QlkhPermissions,
                qlcp = matrix.QlcpPermissions,
                users = matrix.UserPermissions,
                dashboard = matrix.DashboardPermissions
            },
            qlkhFields = matrix.QlkhFields.Select(g => new
            {
                key = g.Key,
                label = g.Label,
                children = g.Children.Select(c => new { key = c.Key, label = c.Label })
            }),
            qlcpFields = matrix.QlcpFields.Select(g => new
            {
                key = g.Key,
                label = g.Label,
                children = g.Children.Select(c => new { key = c.Key, label = c.Label })
            }),
            userFields = matrix.UserFields.Select(g => new
            {
                key = g.Key,
                label = g.Label,
                children = g.Children.Select(c => new { key = c.Key, label = c.Label })
            }),
            dashboardFields = matrix.DashboardFields.Select(g => new
            {
                key = g.Key,
                label = g.Label,
                children = g.Children.Select(c => new { key = c.Key, label = c.Label })
            })
        });
    }

    [HttpGet("current")]
    public async Task<ActionResult<object>> GetCurrentPermissions([FromQuery] string module)
    {
        if (string.IsNullOrWhiteSpace(module))
        {
            return BadRequest(new { message = "Thiếu tham số module" });
        }

        var roleCode = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (string.IsNullOrWhiteSpace(roleCode))
        {
            return Forbid();
        }

        var permissions = await _permissionService.GetRolePermissionsForModuleAsync(module, roleCode);

        return Ok(new
        {
            module,
            role = roleCode,
            permissions
        });
    }

    [HttpPost]
    [Authorize(Roles = "admin,ceo")]
    public async Task<ActionResult> SavePermissions(
        [FromBody] Dictionary<string, Dictionary<string, Dictionary<string, string>>> permissions)
    {
        await _permissionService.SavePermissionMatrixAsync(permissions);
        return Ok(new { message = "Cập nhật phân quyền thành công" });
    }
}
