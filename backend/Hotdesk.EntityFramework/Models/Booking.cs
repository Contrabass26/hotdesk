using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Booking
{
    public int BookingId { get; set; }

    public int UserId { get; set; }

    public int DeskId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Desk Desk { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
