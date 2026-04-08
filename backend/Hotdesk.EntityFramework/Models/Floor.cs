using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Floor
{
    public int FloorId { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Desk> Desks { get; set; } = new List<Desk>();

    public virtual ICollection<Wall> Walls { get; set; } = new List<Wall>();
}
