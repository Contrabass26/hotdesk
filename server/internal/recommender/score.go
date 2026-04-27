package recommender

import(
	"math"
	"time"
	deskmodel "hotdesk/server/internal/desks/model"
	bookingmodel "hotdesk/server/internal/bookings/model"
	usermodel "hotdesk/server/internal/users/model"
)
/**returns the distance between two desks
  *might be replaced by something more intelligent later */
func distanceBetween(a, b deskmodel.Desk) float64 {
	return math.Sqrt(math.Pow(float64(a.XCoord - b.XCoord), 2) + math.Pow(float64(a.YCoord - b.YCoord), 2))
}
//returns all bookings of users in the same group as target that overlap with the given time range
func shiftCoworkers(group int64, startTime time.Time, endTime time.Time, users []usermodel.User, bookings []bookingmodel.Booking) []bookingmodel.Booking {
	var coworkerShifts []bookingmodel.Booking
	for _, user := range users {
		if user.GroupID == group{
			for _, booking := range bookings {
				if booking.UserID == user.ID && booking.StartTime.Before(endTime) && booking.EndTime.After(startTime) {
					coworkerShifts = append(coworkerShifts, booking)
					break
				}
			}
		}
	}
	return coworkerShifts
}
//returns the max of two times
func max(a, b time.Time) time.Time {	
	if a.After(b) {
		return a
	}
	return b
}
//returns the min of two times
func min(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}
//returns true if the desk is free between the times, false otherwise
func IsFree(desk deskmodel.Desk, startTime time.Time, endTime time.Time, bookings []bookingmodel.Booking) bool {
	for _, booking := range bookings {
		if booking.DeskID == desk.ID && booking.StartTime.Before(endTime) && booking.EndTime.After(startTime) {
			return false
		}
	}
	return true
}
//returns all free desks for the given time range
func FreeDesks(desks []deskmodel.Desk, startTime time.Time, endTime time.Time, bookings []bookingmodel.Booking) []deskmodel.Desk {
	var freeDesks []deskmodel.Desk
	for _, desk := range desks {
		if IsFree(desk, startTime, endTime, bookings) {
			freeDesks = append(freeDesks, desk)
		}
	}
	return freeDesks
}
/**returns the average distance between the desks the list of coworkers are booked to between the times 
  *weighted by the proportion of time they are there */
func GroupDistance(desk deskmodel.Desk, coworkerShifts []bookingmodel.Booking, startTime time.Time, endTime time.Time) float64 {
	var totlaWeightedDistance float64 //total distance * overlap time for each coworkerShift
	var totalOverlapTime float64 //total overlap time for all coworkerShifts
	for _, shift := range coworkerShifts {
		if(startTime.After(shift.EndTime) || endTime.Before(shift.StartTime)) {
			continue
		}
		overlapStart := max(startTime, shift.StartTime)
		overlapEnd := min(endTime, shift.EndTime)
		overlapDuration := overlapEnd.Sub(overlapStart).Hours()	
		totalOverlapTime += overlapDuration
		totlaWeightedDistance += distanceBetween(desk, shift.Desk) * overlapDuration
	}
	return totlaWeightedDistance / totalOverlapTime
}
/**returns a score for a desk based on distance to coworkers 
  *and the score it would have for other users 
  *returns (score gain for this team) - (max score loss for other teams) 
  *when compared to next best desk*/
func ScoreDesk(desk deskmodel.Desk, target usermodel.User, startTime time.Time, endTime time.Time, desks []deskmodel.Desk , groupIDs []int64, bookings []bookingmodel.Booking) float64 {
	bestDesk = make(map[int64](int64,float64)) //map of groupID to (deskID, score) for the best desk for that group
	nextBestDesk = make(map[int64](int64,float64)) //map of groupID to (deskID, score) for the next best desk for that group
	coworkerShifts := shiftCoworkers(target.GroupID, startTime, endTime, users, bookings)
	for _, groupID := range groupIDs {
		for _, d := range desks {
			coworkerShifts := shiftCoworkers(groupID, startTime, endTime, users, bookings)
			groupDistance := GroupDistance(d, coworkerShifts, startTime, endTime)
			if(bestDesk[groupID] == nil || groupDistance < bestDesk[groupID][1]) {
				nextBestDesk[groupID] = bestDesk[groupID]
				bestDesk[groupID] = (d.ID, groupDistance)
			}
			else if(nextBestDesk[groupID] == nil || groupDistance < nextBestDesk[groupID][1]) {
				nextBestDesk[groupID] = (d.ID, groupDistance)
			}
		}
	}
	scoreGain :=  GroupDistance(desk, coworkerShifts, startTime, endTime) - bestDesk[target.GroupID][1]
	maxScoreLoss := 0.0
	for groupID, best := range bestDesk {
		if groupID != target.GroupID && best[0] == desk.ID {
			scoreLoss := GroupDistance(desks[best[0]], shiftCoworkers(groupID, startTime, endTime, users, bookings), startTime, endTime) - GroupDistance(desks[nextBestDesk[groupID][0]], shiftCoworkers(groupID, startTime, endTime, users, bookings), startTime, endTime)
			if scoreLoss > maxScoreLoss {
				maxScoreLoss = scoreLoss
			}
		}
	}
	return scoreGain - maxScoreLoss
}

/** 

