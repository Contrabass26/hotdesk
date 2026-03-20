using System;
using System.Collections.Generic;

namespace Hotdesk.Core.Models;

public class Floor
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Desk> Desks { get; set; } = new List<Desk>();
}
