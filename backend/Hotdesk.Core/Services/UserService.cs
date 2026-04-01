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

    public User GetUser(int id)
    {
        return _mapper.Map<User>(_dbContext.users.First(x => x.user_id == id));
    }
}