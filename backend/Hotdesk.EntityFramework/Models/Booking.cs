using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Booking
{
    public int booking_id { get; set; }

    public int user_id { get; set; }

    public int desk_id { get; set; }

    public DateTime start_time { get; set; }

    public DateTime end_time { get; set; }

    public string status { get; set; } = null!;

    public DateTime created_at { get; set; }

    public virtual Desk desk { get; set; } = null!;

    public virtual User user { get; set; } = null!;
}
