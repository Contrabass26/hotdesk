using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Department
{
    public int department_id { get; set; }

    public string name { get; set; } = null!;

    public virtual ICollection<Team> teams { get; set; } = new List<Team>();
}
