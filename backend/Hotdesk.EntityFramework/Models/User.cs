using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool IsAdmin { get; set; }

    public int? TeamId { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual Team? Team { get; set; }
}
