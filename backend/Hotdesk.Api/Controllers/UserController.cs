using Hotdesk.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hotdesk.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UserController : ControllerBase
{
    IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("{id}")]
    public IActionResult GetUser(int id) => Ok(_userService.GetUser(id));
}