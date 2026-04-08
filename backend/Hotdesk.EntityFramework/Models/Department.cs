using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Department
{
    public int DepartmentId { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
