namespace Hotdesk.Core.Models;

public class Wall
{
    public int Id { get; set; }

    public int FloorId { get; set; }

    public decimal XStart { get; set; }

    public decimal YStart { get; set; }

    public decimal XEnd { get; set; }

    public decimal YEnd { get; set; }
}
