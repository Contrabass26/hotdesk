using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Desk
{
    public int desk_id { get; set; }

    public int floor_id { get; set; }

    public string label { get; set; } = null!;

    public decimal x_coord { get; set; }

    public decimal y_coord { get; set; }

    public bool is_enabled { get; set; }

    public virtual ICollection<Booking> bookings { get; set; } = new List<Booking>();

    public virtual Floor floor { get; set; } = null!;
}
