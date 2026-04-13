using Hotdesk.Core.Models;

namespace Hotdesk.Core.Services.Interfaces;

public interface IBookingService
{
    Booking GetBooking(int id);
    IEnumerable<Booking> GetBookings();
    void CreateBooking(Booking booking);
    Booking UpdateBooking(int id, Booking newBooking);
    Booking? DeleteBooking(int id);
}
