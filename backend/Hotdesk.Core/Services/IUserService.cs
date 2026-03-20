using Hotdesk.Core.Models;

namespace Hotdesk.Core.Services;

public interface IUserService
{
    User GetUser(int id);
}
