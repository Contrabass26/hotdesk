using System;
using System.Collections.Generic;

namespace Hotdesk.Core.Models;

public class Team
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int DepartmentId { get; set; }

    public virtual Department Department { get; set; } = null!;

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
