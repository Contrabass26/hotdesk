using AutoMapper;
using Hotdesk.Core.Models;

namespace Hotdesk.Core;

public sealed class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<EntityFramework.Models.Booking, Booking>();
        CreateMap<EntityFramework.Models.Department, Department>();
        CreateMap<EntityFramework.Models.Desk, Desk>();
        CreateMap<EntityFramework.Models.Floor, Floor>();
        CreateMap<EntityFramework.Models.Team, Team>();
        CreateMap<EntityFramework.Models.User, User>();
        CreateMap<EntityFramework.Models.Wall, Wall>();
    }
}