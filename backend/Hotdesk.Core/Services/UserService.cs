using AutoMapper;
using Hotdesk.Core.Models;
using Hotdesk.Core.Services.Interfaces;
using Hotdesk.EntityFramework;

namespace Hotdesk.Core.Services;

public class UserService : IUserService
{
    HotdeskDbContext _dbContext;
    IMapper _mapper;

    public UserService(HotdeskDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public void CreateUser(User user)
    {
        _dbContext.Users.Add(_mapper.Map<EntityFramework.Models.User>(user));
        _dbContext.SaveChanges();
    }

    public User? DeleteUser(int id)
    {
        User user = GetUser(id);
        _dbContext.Users.Remove(_dbContext.Users.First(x => x.UserId == id));
        _dbContext.SaveChanges();
        return user;
    }

    // Should probably update to return nullable user.
    public User GetUser(int id)
    {
        return _mapper.Map<User>(_dbContext.Users.First(x => x.UserId == id));
    }

    public IEnumerable<User> GetUsers()
    {
        return _dbContext.Users.Select(user => _mapper.Map<User>(user));
    }

    public User UpdateUser(int id, User newUser)
    {
        newUser.Id = id;
        _dbContext.Users.Update(_mapper.Map<EntityFramework.Models.User>(newUser));
        return GetUser(id);
    }
}