import { useState, useEffect, useMemo } from 'react';
import { api } from './api/client';
import { useAuth } from './hooks/useAuth';
import { useFestivals } from './hooks/useFestivals';
import { useTheaters } from './hooks/useTheaters';
import { useEvents } from './hooks/useEvents';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { FestivalSelector } from './components/FestivalSelector';
import { SearchFilter } from './components/SearchFilter';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { EventModal } from './components/EventModal';
import { SendInviteModal } from './components/SendInviteModal';
import { Settings } from './components/Settings';
import type { View, EventType, FestivalEventWithTheater } from './types';

function App() {
  const [activeView, setActiveView] = useState<View>('table');
  const [selectedFestivalId, setSelectedFestivalId] = useState<string | null>(
    () => localStorage.getItem('selectedFestivalId')
  );
  const [editingEvent, setEditingEvent] = useState<FestivalEventWithTheater | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [invitingEvent, setInvitingEvent] = useState<FestivalEventWithTheater | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'kaikki'>('kaikki');
  const [theaterFilter, setTheaterFilter] = useState('');

  const { user, loading: authLoading, signIn, signOut } = useAuth();

  const { festivals, loading: festivalsLoading, addFestival, deleteFestival } = useFestivals(!!user);
  const { theaters, addTheater } = useTheaters(!!user);
  const {
    events, loading: eventsLoading, error: eventsError,
    addEvent, updateEvent, deleteEvent, importEvents,
  } = useEvents(selectedFestivalId);

  // Valitse ensimmäinen festivaali automaattisesti kun lista latautuu
  useEffect(() => {
    if (!selectedFestivalId && festivals.length > 0) {
      setSelectedFestivalId(festivals[0].id);
    }
  }, [festivals, selectedFestivalId]);

  useEffect(() => {
    if (selectedFestivalId) {
      localStorage.setItem('selectedFestivalId', selectedFestivalId);
    }
  }, [selectedFestivalId]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (typeFilter !== 'kaikki' && event.type !== typeFilter) return false;
      if (theaterFilter && event.theaterId !== theaterFilter) return false;
      if (search && !event.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, typeFilter, theaterFilter, search]);

  const handleSaveEvent = async (data: Parameters<typeof addEvent>[0]) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await addEvent(data);
    }
    setEditingEvent(null);
  };

  const handleEditEvent = (event: FestivalEventWithTheater) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Poistetaanko tapahtuma?')) return;
    try {
      await deleteEvent(id);
    } catch (err) {
      alert('Virhe poistettaessa: ' + (err instanceof Error ? err.message : 'Tuntematon virhe'));
    }
  };

  const handleDeleteFestival = async (id: string) => {
    await deleteFestival(id);
    if (selectedFestivalId === id) {
      setSelectedFestivalId(null);
      localStorage.removeItem('selectedFestivalId');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onSignIn={signIn} />;
  }

  const selectedFestival = festivals.find((f) => f.id === selectedFestivalId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-black text-white py-4 px-4 shadow-md safe-top flex items-center justify-center">
        <h1 className="text-xl font-bold text-white">HIFF</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {activeView !== 'settings' && (
          <>
            {festivalsLoading ? (
              <p className="text-center text-gray-500">Ladataan festivaaleja...</p>
            ) : (
              <FestivalSelector
                festivals={festivals}
                selectedId={selectedFestivalId}
                onSelect={setSelectedFestivalId}
                onCreate={addFestival}
              />
            )}

            {selectedFestival && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <SearchFilter
                    search={search}
                    onSearchChange={setSearch}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    theaterFilter={theaterFilter}
                    onTheaterFilterChange={setTheaterFilter}
                    theaters={theaters}
                  />
                  <button
                    onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                    className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 whitespace-nowrap"
                  >
                    + Lisää
                  </button>
                </div>

                {eventsLoading ? (
                  <p className="text-center text-gray-500 py-8">Ladataan tapahtumia...</p>
                ) : eventsError ? (
                  <p className="text-center text-red-600 py-8">Virhe: {eventsError}</p>
                ) : activeView === 'table' ? (
                  <TableView
                    events={filteredEvents}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onInvite={setInvitingEvent}
                  />
                ) : (
                  <CalendarView
                    events={filteredEvents}
                    onEdit={handleEditEvent}
                    onInvite={setInvitingEvent}
                  />
                )}
              </>
            )}

            {!selectedFestival && !festivalsLoading && (
              <p className="text-center text-gray-500 py-8">Luo ensin festivaali aloittaaksesi.</p>
            )}
          </>
        )}

        {activeView === 'settings' && (
          <Settings
            festivals={festivals}
            onImport={importEvents}
            onDeleteFestival={handleDeleteFestival}
            username={user.username ?? undefined}
            onSignOut={signOut}
          />
        )}
      </main>

      {showEventModal && selectedFestivalId && (
        <EventModal
          festivalId={selectedFestivalId}
          theaters={theaters}
          editingEvent={editingEvent}
          onSave={handleSaveEvent}
          onCreateTheater={addTheater}
          onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
        />
      )}

      {invitingEvent && (
        <SendInviteModal
          event={invitingEvent}
          defaultEmail={user.email ?? ''}
          onSend={async (id, email) => { await api.sendInvite(id, email); }}
          onClose={() => setInvitingEvent(null)}
        />
      )}

      <Navigation activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}

export default App;
