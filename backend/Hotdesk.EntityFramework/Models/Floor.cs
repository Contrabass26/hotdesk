using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Floor
{
    public int floor_id { get; set; }

    public string name { get; set; } = null!;

    public virtual ICollection<Desk> desks { get; set; } = new List<Desk>();
}
