using System;
using System.Collections.Generic;

namespace Hotdesk.EntityFramework.Models;

public partial class Team
{
    public int team_id { get; set; }

    public string name { get; set; } = null!;

    public int department_id { get; set; }

    public virtual Department department { get; set; } = null!;

    public virtual ICollection<User> users { get; set; } = new List<User>();
}
