using Hotdesk.Core.Models;

namespace Hotdesk.Core.Services.Interfaces;

public interface IUserService
{
    User GetUser(int id);
    IEnumerable<User> GetUsers();
    void CreateUser(User user);
    User UpdateUser(int id, User newUser);
    User? DeleteUser(int id);
}
