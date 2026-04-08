using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Wall
{
    public int WallId { get; set; }

    public int FloorId { get; set; }

    public decimal XStart { get; set; }

    public decimal YStart { get; set; }

    public decimal XEnd { get; set; }

    public decimal YEnd { get; set; }

    public virtual Floor Floor { get; set; } = null!;
}
