using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class User
{
    public int user_id { get; set; }

    public string name { get; set; } = null!;

    public string email { get; set; } = null!;

    public string password_hash { get; set; } = null!;

    public bool is_admin { get; set; }

    public int? team_id { get; set; }

    public virtual ICollection<Booking> bookings { get; set; } = new List<Booking>();

    public virtual Team? team { get; set; }
}
