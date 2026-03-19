using Hotdesk.Core.Models;
using Hotdesk.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hotdesk.Api.Controllers;

public class UserController : Controller
{
    IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public User GetUser(int id) => _userService.GetUser(id);
}