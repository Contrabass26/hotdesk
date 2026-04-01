using Hotdesk.Core.Models;

namespace Hotdesk.Core.Services.Interfaces;

public interface IUserService
{
    User GetUser(int id);
}
