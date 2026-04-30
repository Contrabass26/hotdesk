package recommender

import (
	bookingmodel "hotdesk/server/internal/bookings"
	deskmodel "hotdesk/server/internal/desks"
	usermodel "hotdesk/server/internal/users"
	"math"
	"time"
)

// distanceBetween returns the distance between two desks.
func distanceBetween(a, b deskmodel.Desk) float64 {
	return math.Sqrt(math.Pow(float64(a.XCoord-b.XCoord), 2) + math.Pow(float64(a.YCoord-b.YCoord), 2))
}

// buildDeskIndex returns a map of desk ID → Desk
func buildDeskIndex(desks []deskmodel.Desk) map[int64]deskmodel.Desk {
	index := make(map[int64]deskmodel.Desk, len(desks))
	for _, d := range desks {
		index[d.ID] = d
	}
	return index
}

// laterOf returns the later of two times (replaces shadowed built-in on Go ≥1.21).
func laterOf(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}

// earlierOf returns the earlier of two times (replaces shadowed built-in on Go ≥1.21).
func earlierOf(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

// shiftCoworkers returns all bookings whose owner belongs to team and that
// overlap [startTime, endTime). All matching bookings are included — the
// original code broke after the first match per user, which was a bug.
func shiftCoworkers(
	team int64,
	startTime, endTime time.Time,
	users []usermodel.User,
	bookings []bookingmodel.Booking,
) []bookingmodel.Booking {
	// Build a set of user IDs that belong to the team.
	teamUserIDs := make(map[int64]struct{})
	for _, u := range users {
		if u.TeamID != nil && *u.TeamID == team {
			teamUserIDs[u.ID] = struct{}{}
		}
	}

	var coworkerShifts []bookingmodel.Booking
	for _, booking := range bookings {
		if _, ok := teamUserIDs[booking.UserID]; !ok {
			continue
		}
		if booking.StartTime.Before(endTime) && booking.EndTime.After(startTime) {
			coworkerShifts = append(coworkerShifts, booking)
		}
	}
	return coworkerShifts
}

// isFree reports whether desk has no booking that overlaps [startTime, endTime).
func isFree(
	desk deskmodel.Desk,
	startTime, endTime time.Time,
	bookings []bookingmodel.Booking,
) bool {
	for _, booking := range bookings {
		if booking.DeskID == desk.ID &&
			booking.StartTime.Before(endTime) &&
			booking.EndTime.After(startTime) {
			return false
		}
	}
	return true
}

// FreeDesks returns all desks that are unbooked for the entire [startTime, endTime) window.
func FreeDesks(
	desks []deskmodel.Desk,
	startTime, endTime time.Time,
	bookings []bookingmodel.Booking,
) []deskmodel.Desk {
	var free []deskmodel.Desk
	for _, desk := range desks {
		if isFree(desk, startTime, endTime, bookings) {
			free = append(free, desk)
		}
	}
	return free
}

// avgTeamDistance returns the time-weighted average distance from desk to the
// desks occupied by each booking in coworkerShifts during [startTime, endTime).
func avgTeamDistance(
	desk deskmodel.Desk,
	coworkerShifts []bookingmodel.Booking,
	startTime, endTime time.Time,
	deskIndex map[int64]deskmodel.Desk,
) float64 {
	var totalWeightedDistance, totalOverlapTime float64
	for _, shift := range coworkerShifts {
		if !shift.StartTime.Before(endTime) || !shift.EndTime.After(startTime) {
			continue
		}
		overlapDuration := earlierOf(endTime, shift.EndTime).
			Sub(laterOf(startTime, shift.StartTime)).
			Hours()
		coworkerDesk, ok := deskIndex[shift.DeskID]
		if !ok {
			continue // booking references a desk that no longer exists; skip
		}
		totalOverlapTime += overlapDuration
		totalWeightedDistance += distanceBetween(desk, coworkerDesk) * overlapDuration
	}
	if totalOverlapTime == 0 {
		return 0
	}
	return totalWeightedDistance / totalOverlapTime
}

// teamBestAndSecond holds the best and second-best desk IDs and their scores
// (lower distance = better) for a single team.
type teamBestAndSecond struct {
	bestID      int64
	bestScore   float64
	bestSet     bool
	secondID    int64
	secondScore float64
	secondSet   bool
}

func (t *teamBestAndSecond) consider(deskID int64, score float64) {
	if !t.bestSet || score < t.bestScore {
		if t.bestSet {
			t.secondID = t.bestID
			t.secondScore = t.bestScore
			t.secondSet = true
		}
		t.bestID = deskID
		t.bestScore = score
		t.bestSet = true
	} else if !t.secondSet || score < t.secondScore {
		t.secondID = deskID
		t.secondScore = score
		t.secondSet = true
	}
}

// DeskScore returns a score for desk relative to target's preferences.
//
// The score is:
//
//	(distance saving for target's team) − (max distance loss imposed on any other team)
//
// A lower (more negative) score is better.
//
// Returns an error if target has no team or if startTime is not before endTime.
func DeskScore(
	desk deskmodel.Desk,
	target usermodel.User,
	startTime, endTime time.Time,
	desks []deskmodel.Desk,
	teams []Team,
	bookings []bookingmodel.Booking,
	users []usermodel.User,
) (float64, error) {

	if target.TeamID == nil {
		return 0, ErrUserHasNoTeam
	}

	deskIndex := buildDeskIndex(desks)

	teamShifts := make(map[int64][]bookingmodel.Booking, len(teams))
	for _, team := range teams {
		teamShifts[team.ID] = shiftCoworkers(team.ID, startTime, endTime, users, bookings)
	}

	// For each team, find the best and second-best desk by avgTeamDistance.
	ranking := make(map[int64]*teamBestAndSecond, len(teams))
	for _, team := range teams {
		bs := &teamBestAndSecond{}
		for _, d := range desks {
			score := avgTeamDistance(d, teamShifts[team.ID], startTime, endTime, deskIndex)
			bs.consider(d.ID, score)
		}
		ranking[team.ID] = bs
	}

	targetTeamID := *target.TeamID
	targetShifts := teamShifts[targetTeamID]
	targetRanking := ranking[targetTeamID]

	deskDistForTarget := avgTeamDistance(desk, targetShifts, startTime, endTime, deskIndex)

	var bestScoreForTarget float64
	if targetRanking != nil && targetRanking.bestSet {
		bestScoreForTarget = targetRanking.bestScore
	}
	scoreGain := deskDistForTarget - bestScoreForTarget

	maxScoreLoss := 0.0
	for _, team := range teams {
		if team.ID == targetTeamID {
			continue
		}
		r := ranking[team.ID]
		if r == nil || !r.bestSet || r.bestID != desk.ID || !r.secondSet {
			continue
		}
		scoreLoss := r.secondScore - r.bestScore
		if scoreLoss > maxScoreLoss {
			maxScoreLoss = scoreLoss
		}
	}

	return scoreGain - maxScoreLoss, nil
}
