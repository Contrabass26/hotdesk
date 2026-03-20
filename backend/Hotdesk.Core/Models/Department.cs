using System;
using System.Collections.Generic;

namespace Hotdesk.Core.Models;

public class Department
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
