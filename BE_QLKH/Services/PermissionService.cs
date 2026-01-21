using BE_QLKH.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace BE_QLKH.Services;

public class PermissionService : IPermissionService
{
    private readonly IMongoCollection<Role> _roles;
    private readonly IMongoCollection<FieldDef> _fields;
    private readonly IMongoCollection<FieldPermission> _fieldPermissions;

    public PermissionService(IMongoClient client, IOptions<MongoDbSettings> options)
    {
        var db = client.GetDatabase(options.Value.DatabaseName);
        _roles = db.GetCollection<Role>("roles");
        _fields = db.GetCollection<FieldDef>("fields");
        _fieldPermissions = db.GetCollection<FieldPermission>("field_permissions");
    }

    public async Task<PermissionMatrixDto> GetPermissionMatrixAsync()
    {
        var roles = await _roles.Find(r => r.IsActive).ToListAsync();
        var fields = await _fields.Find(_ => true).ToListAsync();
        var fieldPermissions = await _fieldPermissions.Find(_ => true).ToListAsync();

        var roleDtos = roles.Select(r => new RoleDto
        {
            Key = r.Code,
            Label = r.Name
        }).ToList();

        var qlkhFields = fields.Where(f => f.ModuleCode == "qlkh").ToList();
        var qlcpFields = fields.Where(f => f.ModuleCode == "qlcp").ToList();
        var userFields = fields.Where(f => f.ModuleCode == "users").ToList();
        var dashboardFields = fields.Where(f => f.ModuleCode == "dashboard").ToList();

        var qlkhGroups = BuildFieldGroups(qlkhFields);
        var qlcpGroups = BuildFieldGroups(qlcpFields);
        var userGroups = BuildFieldGroups(userFields);
        var dashboardGroups = BuildFieldGroups(dashboardFields);

        var qlkhPerm = BuildPermissionMap("qlkh", qlkhFields, roles, fieldPermissions);
        var qlcpPerm = BuildPermissionMap("qlcp", qlcpFields, roles, fieldPermissions);
        var userPerm = BuildPermissionMap("users", userFields, roles, fieldPermissions);
        var dashboardPerm = BuildPermissionMap("dashboard", dashboardFields, roles, fieldPermissions);

        return new PermissionMatrixDto
        {
            Roles = roleDtos,
            QlkhFields = qlkhGroups,
            QlcpFields = qlcpGroups,
            UserFields = userGroups,
            DashboardFields = dashboardGroups,
            QlkhPermissions = qlkhPerm,
            QlcpPermissions = qlcpPerm,
            UserPermissions = userPerm,
            DashboardPermissions = dashboardPerm
        };
    }

    public async Task SavePermissionMatrixAsync(
        Dictionary<string, Dictionary<string, Dictionary<string, string>>> permissions)
    {
        foreach (var moduleEntry in permissions)
        {
            var moduleCode = moduleEntry.Key;
            foreach (var fieldEntry in moduleEntry.Value)
            {
                var fieldCode = fieldEntry.Key;
                foreach (var roleEntry in fieldEntry.Value)
                {
                    var roleCode = roleEntry.Key;
                    var level = roleEntry.Value;

                    var filter = Builders<FieldPermission>.Filter.Where(p =>
                        p.ModuleCode == moduleCode &&
                        p.FieldCode == fieldCode &&
                        p.RoleCode == roleCode);

                    var update = Builders<FieldPermission>.Update
                        .Set(p => p.PermissionLevel, level)
                        .SetOnInsert(p => p.ModuleCode, moduleCode)
                        .SetOnInsert(p => p.FieldCode, fieldCode)
                        .SetOnInsert(p => p.RoleCode, roleCode);

                    await _fieldPermissions.UpdateOneAsync(
                        filter,
                        update,
                        new UpdateOptions { IsUpsert = true });
                }
            }
        }
    }

    public async Task<Dictionary<string, string>> GetRolePermissionsForModuleAsync(string moduleCode, string roleCode)
    {
        var fields = await _fields.Find(f => f.ModuleCode == moduleCode).ToListAsync();
        var fieldCodes = fields.Select(f => f.Code).ToList();

        var filter = Builders<FieldPermission>.Filter.Where(p =>
            p.ModuleCode == moduleCode &&
            fieldCodes.Contains(p.FieldCode) &&
            p.RoleCode == roleCode);

        var permissions = await _fieldPermissions.Find(filter).ToListAsync();

        var result = new Dictionary<string, string>();

        foreach (var field in fields)
        {
            var fp = permissions.FirstOrDefault(p => p.FieldCode == field.Code);
            var level = fp?.PermissionLevel ?? "R";
            result[field.Code] = level;
        }

        return result;
    }

    private static Dictionary<string, Dictionary<string, string>> BuildPermissionMap(
        string moduleCode,
        List<FieldDef> fields,
        List<Role> roles,
        List<FieldPermission> fieldPermissions)
    {
        var result = new Dictionary<string, Dictionary<string, string>>();

        foreach (var field in fields)
        {
            var fieldCode = field.Code;
            if (!result.ContainsKey(fieldCode))
            {
                result[fieldCode] = new Dictionary<string, string>();
            }

            foreach (var role in roles)
            {
                var fp = fieldPermissions.FirstOrDefault(p =>
                    p.ModuleCode == moduleCode &&
                    p.FieldCode == fieldCode &&
                    p.RoleCode == role.Code);

                var level = fp?.PermissionLevel ?? "R";
                result[fieldCode][role.Code] = level;
            }
        }

        return result;
    }

    private static List<PermissionFieldGroupDto> BuildFieldGroups(List<FieldDef> fields)
    {
        return fields
            .GroupBy(f => new { f.GroupCode, f.GroupLabel })
            .OrderBy(g => g.Key.GroupLabel)
            .Select(g => new PermissionFieldGroupDto
            {
                Key = g.Key.GroupCode,
                Label = g.Key.GroupLabel,
                Children = g
                    .OrderBy(f => f.OrderIndex)
                    .Select(f => new PermissionFieldDto
                    {
                        Key = f.Code,
                        Label = f.Label
                    }).ToList()
            })
            .ToList();
    }
}
