import { useState, useMemo, useEffect } from 'react'
import './Calendar.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_COLORS = ['#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0284c7', '#ca8a04']

// Purple heat colour as RGB components — applied inline so CSS vars aren't needed inside rgba()
const HEAT_R = 124, HEAT_G = 58, HEAT_B = 237

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay() }
function toKey(y, m, d)       { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
function isoToKey(iso)        { const d = new Date(iso); return isNaN(d) ? null : toKey(d.getFullYear(), d.getMonth(), d.getDate()) }

const emptyEvent = { title: '', time: '', location: '', color: EVENT_COLORS[0], note: '' }

export default function Calendar({ transactions = [] }) {
  const today = new Date()
  const [cur, setCur]         = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(null)

  const [events, setEvents] = useState(() => {
    try { const s = localStorage.getItem('calendarEvents'); return s ? JSON.parse(s) : {} }
    catch { return {} }
  })
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events))
  }, [events])

  const [showEventForm, setShowEventForm]         = useState(false)
  const [eventForm, setEventForm]                 = useState(emptyEvent)
  const [editingEventIndex, setEditingEventIndex] = useState(null)

  const { year, month } = cur

  // Build expense map
  const expenseMap = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      if (t.type !== 'expense') return
      const k = isoToKey(t.date)
      if (!k) return
      map[k] = (map[k] || 0) + Math.abs(t.amount)
    })
    return map
  }, [transactions])

  const maxExpense = Math.max(...Object.values(expenseMap), 1)

  const selectedKey          = selected ? toKey(year, month, selected) : null
  const selectedEvents       = selectedKey ? (events[selectedKey] || []) : []
  const selectedTransactions = useMemo(() => {
    if (!selectedKey) return []
    return transactions.filter(t => isoToKey(t.date) === selectedKey)
  }, [selectedKey, transactions])

  function prevMonth() { setCur(c => c.month === 0  ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }); setSelected(null) }
  function nextMonth() { setCur(c => c.month === 11 ? { year: c.year + 1, month: 0  } : { ...c, month: c.month + 1 }); setSelected(null) }
  function goToday()   { setCur({ year: today.getFullYear(), month: today.getMonth() }); setSelected(today.getDate()) }

  function openAddForm()  { setEditingEventIndex(null); setEventForm(emptyEvent); setShowEventForm(true) }
  function openEditForm(idx) { setEditingEventIndex(idx); setEventForm({ ...selectedEvents[idx] }); setShowEventForm(true) }
  function cancelForm()   { setEventForm(emptyEvent); setEditingEventIndex(null); setShowEventForm(false) }

  function saveEvent() {
    if (!eventForm.title.trim() || !selectedKey) return
    setEvents(prev => {
      const list = [...(prev[selectedKey] || [])]
      editingEventIndex !== null ? list[editingEventIndex] = { ...eventForm } : list.push({ ...eventForm })
      return { ...prev, [selectedKey]: list }
    })
    setEventForm(emptyEvent); setEditingEventIndex(null); setShowEventForm(false)
  }

  function deleteEvent(key, idx) {
    setEvents(prev => {
      const updated = [...(prev[key] || [])]
      updated.splice(idx, 1)
      if (editingEventIndex === idx) { setEditingEventIndex(null); setShowEventForm(false); setEventForm(emptyEvent) }
      return { ...prev, [key]: updated }
    })
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDay(year, month)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="cal-cell cal-empty" />)

  for (let day = 1; day <= daysInMonth; day++) {
    const key      = toKey(year, month, day)
    const expense  = expenseMap[key] || 0
    // Logarithmic scale so $1 vs $432 look visually distinct.
    // log(1+expense) / log(1+max) maps small values to ~0.15+ and large to 1.
    const alpha = expense
      ? Math.min(Math.log1p(expense) / Math.log1p(maxExpense), 1)
      : 0
    const dayEvents = events[key] || []
    const isToday  = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
    const isSel    = selected === day

    // Apply heat background directly via inline style background
    // Use a stronger alpha range (0.12 → 0.55) so heat is clearly visible
    const heatAlpha = expense > 0 ? (0.12 + alpha * 0.43).toFixed(3) : 0
    const cellBg = expense > 0
      ? `rgba(${HEAT_R}, ${HEAT_G}, ${HEAT_B}, ${heatAlpha})`
      : '#f9fafb'

    cells.push(
      <div
        key={day}
        className={`cal-cell${isToday ? ' cal-today' : ''}${isSel ? ' cal-selected' : ''}`}
        style={{
          background: cellBg,
          ...(isSel && expense > 0 ? { outline: '3px solid #7c3aed', outlineOffset: '-2px' } : {})
        }}
        onClick={() => setSelected(isSel ? null : day)}
      >
        <span className="cal-day-num">{day}</span>

        {dayEvents.length > 0 && (
          <div className="cal-event-dots">
            {dayEvents.slice(0, 3).map((ev, i) => (
              <span key={i} className="cal-event-dot" style={{ background: ev.color }} />
            ))}
            {dayEvents.length > 3 && <span className="cal-event-more">+{dayEvents.length - 3}</span>}
          </div>
        )}

        {expense > 0 && (
          <span className="cal-amount">${expense < 100 ? expense.toFixed(0) : Math.round(expense)}</span>
        )}
      </div>
    )
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>Calendar</h1>
        <p className="calendar-subtitle">Track spending &amp; plan your events</p>
      </div>

      <div className="calendar-container">
        {/* Nav */}
        <div className="cal-nav">
          <div className="cal-nav-left">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <button className="cal-nav-btn" onClick={nextMonth}>›</button>
            <h2 className="cal-month-title">{MONTHS[month]} {year}</h2>
          </div>
          <button className="cal-today-btn" onClick={goToday}>Today</button>
        </div>

        <div className="cal-legend">
          <span>Spending:</span>
          <div className="cal-legend-bar">
            {[0.12, 0.23, 0.34, 0.44, 0.55].map(v => (
              <div
                key={v}
                className="cal-legend-swatch"
                style={{ background: `rgba(${HEAT_R}, ${HEAT_G}, ${HEAT_B}, ${v})` }}
              />
            ))}
          </div>
          <span>Less → More</span>
          <span style={{ marginLeft: '1rem' }}>● Events</span>
        </div>

        {/* Weekday headers */}
        <div className="cal-grid cal-weekdays">
          {DAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        </div>

        {/* Day cells */}
        <div className="cal-grid cal-days">{cells}</div>
      </div>

      {/* ── Detail Panel ── */}
      {selected && (
        <div className="cal-detail">
          <div className="cal-detail-header">
            <h3>{MONTHS[month]} {selected}, {year}</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddForm}>+ Add Event</button>
          </div>

          {showEventForm && (
            <div className="cal-event-form">
              <div className="cal-event-form-title">
                {editingEventIndex !== null ? '✏️ Edit Event' : '➕ New Event'}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Title</label>
                  <input type="text" placeholder="e.g. Doctor appointment"
                    value={eventForm.title}
                    onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Time <span className="label-optional">(optional)</span></label>
                  <input type="time" value={eventForm.time}
                    onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location <span className="label-optional">(optional)</span></label>
                  <input type="text" placeholder="e.g. Orchard Road, Singapore"
                    value={eventForm.location}
                    onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Colour</label>
                  <div className="color-picker">
                    {EVENT_COLORS.map(c => (
                      <button key={c} type="button"
                        className={`color-swatch${eventForm.color === c ? ' selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setEventForm(f => ({ ...f, color: c }))} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group form-group-full">
                  <label>Note <span className="label-optional">(optional)</span></label>
                  <input type="text" placeholder="Any additional notes"
                    value={eventForm.note}
                    onChange={e => setEventForm(f => ({ ...f, note: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={cancelForm}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={saveEvent}>
                  {editingEventIndex !== null ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </div>
          )}

          {selectedEvents.length > 0 && (
            <div className="cal-section">
              <h4>🗓️ Events</h4>
              <div className="cal-events-list">
                {selectedEvents.map((ev, i) => (
                  <div key={i}
                    className={`cal-event-item${editingEventIndex === i ? ' cal-event-editing' : ''}`}
                    style={{ borderLeftColor: ev.color }}>
                    <div className="cal-event-main" onClick={() => openEditForm(i)} style={{ cursor: 'pointer' }}>
                      <strong>{ev.title}</strong>
                      {ev.time     && <span className="cal-event-time">🕐 {ev.time}</span>}
                      {ev.location && <span className="cal-event-location">📍 {ev.location}</span>}
                      {ev.note     && <span className="cal-event-note">{ev.note}</span>}
                    </div>
                    <div className="cal-event-actions">
                      <button className="edit-btn" onClick={() => openEditForm(i)} title="Edit">✏️</button>
                      <button className="delete-btn" onClick={() => deleteEvent(selectedKey, i)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTransactions.length > 0 && (
            <div className="cal-section">
              <h4>💸 Transactions</h4>
              <div className="cal-detail-total">
                Total spent: <strong>
                  ${selectedTransactions.filter(t => t.type === 'expense')
                    .reduce((s, t) => s + t.amount, 0).toFixed(2)}
                </strong>
              </div>
              <ul className="cal-detail-list">
                {selectedTransactions.map((t, i) => (
                  <li key={i} className="cal-detail-item">
                    <div className="cal-detail-left">
                      <span className="cal-detail-desc">{t.description}</span>
                      <div className="cal-detail-meta">
                        <span className="tag tag-category">{t.category}</span>
                        {t.needWant && t.type === 'expense' && (
                          <span className={`tag tag-needwant-${t.needWant}`}>
                            {t.needWant === 'need' ? '🛒 Need' : '🛍️ Want'}
                          </span>
                        )}
                        {t.account && <span className="tag">💳 {t.account}</span>}
                        {t.event   && <span className="tag">📅 {t.event}</span>}
                      </div>
                    </div>
                    <span className={`cal-detail-amt ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedEvents.length === 0 && selectedTransactions.length === 0 && (
            <p className="cal-detail-empty">Nothing here yet. Add an event or record a transaction!</p>
          )}
        </div>
      )}
    </div>
  )
}