using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Desk
{
    public int DeskId { get; set; }

    public int FloorId { get; set; }

    public string Label { get; set; } = null!;

    public decimal XCoord { get; set; }

    public decimal YCoord { get; set; }

    public bool IsEnabled { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual Floor Floor { get; set; } = null!;
}
