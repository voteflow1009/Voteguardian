import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { LayoutGrid, Plus, Bell, Search, Image as ImageIcon, MapPin, ChevronDown, CheckCircle, Users, Trophy, Edit2, Check, Trash2, Download, Link as LinkIcon, Send, User, Mail, Phone, Calendar, X, Menu, FileText, Repeat } from 'lucide-react';
import darkLogo from '../logo/dark logo.png';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { getEventDetailHash } from '../utils/slug';

// -------------------------------------------------------------
// OVERVIEW TAB
// -------------------------------------------------------------
const MOCK_LOCATIONS = [
  { id: '1', title: 'JECRC University Campus', subtitle: 'Plot No.IS-2036 to 2039, Ramchandrapura Industrial Area, Vidhani, Rajasthan 303905' },
  { id: '2', title: 'Jaipur Exhibition & Convention Centre (JECC)', subtitle: 'RIICO Industrial Area, Sitapura, Jaipur, Rajasthan 302022' },
  { id: '3', title: 'Rajasthan International Centre', subtitle: 'Jhalana Doongri, Jaipur, Rajasthan 302004' },
  { id: '4', title: 'Birla Auditorium', subtitle: 'Statue Circle, C Scheme, Rambagh, Jaipur, Rajasthan 302005' },
  { id: '5', title: 'Clarks Amer', subtitle: 'Jawahar Lal Nehru Marg, Lal Bahadur Nagar, Chandrakala Colony, Jaipur, Rajasthan 302018' },
];

const DEPARTMENTS = [
  'School of Engineering and Technology',
  'School of Computer Applications',
  'School of Business',
  'School of Design',
  'School of Humanities and Social Sciences',
  'School of Economics',
  'School of Law',
  'School of Sciences',
  'School of Hospitality',
  'School of Mass Communications',
  'Other'
];

function OverviewTab({ event, saveEvent }: { event: any, saveEvent: any }) {
  const [poster, setPoster] = useState<string | null>(event?.image || event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80');
  const [selectedPosterFile, setSelectedPosterFile] = useState<File | null>(null);
  const [isSavingPoster, setIsSavingPoster] = useState(false);

  useEffect(() => {
    if (!selectedPosterFile) {
      setPoster(event?.image || event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80');
    }
  }, [event?.image, event?.imageUrl, selectedPosterFile]);

  const [isEditingDates, setIsEditingDates] = useState(false);
  const [startDate, setStartDate] = useState(event?.startDate ? event.startDate.split('T')[0] : '2026-06-18');
  const [startTime, setStartTime] = useState(event?.startDate && event.startDate.includes('T') ? event.startDate.split('T')[1] : '00:30');
  const [endDate, setEndDate] = useState(event?.endDate ? event.endDate.split('T')[0] : '2026-06-19');
  const [endTime, setEndTime] = useState(event?.endDate && event.endDate.includes('T') ? event.endDate.split('T')[1] : '00:30');

  const [regDeadlineDate, setRegDeadlineDate] = useState(event?.registrationDeadline ? event.registrationDeadline.split('T')[0] : '');
  const [regDeadlineTime, setRegDeadlineTime] = useState(event?.registrationDeadline && event.registrationDeadline.includes('T') ? event.registrationDeadline.split('T')[1] : '');

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [selectedMockLocation, setSelectedMockLocation] = useState<any>(
    event?.location ? { id: 'custom', title: event.location, subtitle: '' } : MOCK_LOCATIONS[0]
  );
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);

  const [participantType, setParticipantType] = useState<'individual' | 'team'>(event?.participantType || 'individual');
  const [teamMin, setTeamMin] = useState(event?.teamMin || '');
  const [teamMax, setTeamMax] = useState(event?.teamMax || '');
  const [capacity, setCapacity] = useState<string>(event?.capacity ? String(event.capacity) : '');

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(event?.description || '');

  const [isEditingElig, setIsEditingElig] = useState(false);
  const [eligYears, setEligYears] = useState(event?.eligibility || '');

  const [isEditingDept, setIsEditingDept] = useState(false);
  const [targetDepartment, setTargetDepartment] = useState(event?.targetDepartment || 'All');

  const [visibility, setVisibility] = useState<'Public' | 'Unlisted' | 'Private'>(event?.visibility || 'Public');
  const [allowMultipleRegistrations, setAllowMultipleRegistrations] = useState<boolean>(event?.allowMultipleRegistrations || false);
  const [isSavingTargetVis, setIsSavingTargetVis] = useState(false);

  useEffect(() => {
    if (event) {
      if (event.visibility) setVisibility(event.visibility);
      if (event.allowMultipleRegistrations !== undefined) setAllowMultipleRegistrations(!!event.allowMultipleRegistrations);
      if (event.capacity !== undefined) setCapacity(event.capacity ? String(event.capacity) : '');
    }
  }, [event]);

  const [timeline, setTimeline] = useState<any[]>(event?.timeline?.length > 0 ? event.timeline : []);
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [newTimeline, setNewTimeline] = useState({ title: '', desc: '', start: '', end: '' });

  const [additionalDocs, setAdditionalDocs] = useState<any[]>(event?.additionalDocs?.length > 0 ? event.additionalDocs : []);

  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rules, setRules] = useState(event?.rules || '');

  const [contacts, setContacts] = useState<any[]>(event?.contacts?.length > 0 ? event.contacts : []);

  const [isAddingPrize, setIsAddingPrize] = useState(false);
  const [prizes, setPrizes] = useState<any[]>(event?.prizes?.length > 0 ? event.prizes : []);
  const [newPrize, setNewPrize] = useState({ rewardType: 'Cash Prize', position: '1st Place', amount: '' });

  const handleAddTimeline = async () => {
    if (!newTimeline.title) return;
    const updated = [...timeline, { id: Date.now(), date: newTimeline.start || 'New', startDate: newTimeline.start, endDate: newTimeline.end, title: newTimeline.title, desc: newTimeline.desc }];
    const success = await saveEvent({ timeline: updated });
    if (success) {
      setTimeline(updated);
      setShowAddTimeline(false);
      setNewTimeline({ title: '', desc: '', start: '', end: '' });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="mobile-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '2.5rem', marginBottom: '2rem' }}>

        {/* Left Column - Poster (A4 size ratio) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            aspectRatio: '1 / 1.414',
            background: '#222',
            borderRadius: '16px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            {poster ? (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                <img src={poster} alt="Blur" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px)', opacity: 0.6, transform: 'scale(1.2)' }} />
                <img src={poster} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
              </div>
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', zIndex: 2, lineHeight: 1.2 }}>upload<br />your image</h3>
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: '#fff', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  <ImageIcon size={20} color="#7c3aed" />
                </div>
              </>
            )}

            <input type="file" ref={fileInputRef} onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                setPoster(url);
                setSelectedPosterFile(file);
              }
            }} style={{ display: 'none' }} accept="image/*" />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {selectedPosterFile ? (
              <>
                <button 
                  onClick={async () => {
                    setIsSavingPoster(true);
                    const formData = new FormData();
                    formData.append('image', selectedPosterFile);
                    await saveEvent(formData);
                    setSelectedPosterFile(null);
                    setIsSavingPoster(false);
                  }} 
                  disabled={isSavingPoster}
                  style={{ flex: 1, background: '#000', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: isSavingPoster ? 0.7 : 1 }}
                >
                  {isSavingPoster ? 'Saving...' : 'Save Poster'}
                </button>
                <button 
                  onClick={() => {
                    setPoster(event?.image || event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80');
                    setSelectedPosterFile(null);
                  }} 
                  disabled={isSavingPoster}
                  style={{ flex: 1, background: '#eaeaea', color: '#555', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, background: '#eaeaea', color: '#555', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  Change Poster
                </button>
                {poster && (
                  <button onClick={async () => { setPoster(null); await saveEvent({ imageUrl: null, image: null }); }} style={{ flex: 1, background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column - Dates & Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Dates */}
          <div style={{ background: '#eaeaea', padding: '20px', borderRadius: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111' }}>Event Timeline</h4>
              <button onClick={async () => {
                if (isEditingDates) {
                  const fullStart = `${startDate}T${startTime}`;
                  const fullEnd = endDate ? `${endDate}T${endTime || '00:00'}` : '';
                  const fullReg = regDeadlineDate ? `${regDeadlineDate}T${regDeadlineTime || '00:00'}` : '';
                  await saveEvent({ startDate: fullStart, endDate: fullEnd, registrationDeadline: fullReg });
                }
                setIsEditingDates(!isEditingDates)
              }} style={{ background: isEditingDates ? '#111' : '#d1d5db', color: isEditingDates ? '#fff' : '#4b5563', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isEditingDates ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111' }} />
                <div style={{ width: '2px', flex: 1, borderLeft: '2px dotted #888', margin: '6px 0' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #111', background: 'transparent' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>Start</div>
                  {isEditingDates ? (
                    <div className="mobile-form-row" style={{ display: 'flex', gap: '8px' }}>
                      <input className="mobile-form-col" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#555' }} />
                      <input className="mobile-form-col" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#555' }} />
                    </div>
                  ) : (
                    <div className="mobile-form-row" style={{ display: 'flex', gap: '8px' }}>
                      <div className="mobile-form-col" style={{ background: '#dcdcdc', textAlign: 'center', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{startDate}</div>
                      <div className="mobile-form-col" style={{ background: '#dcdcdc', textAlign: 'center', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{startTime}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>End</div>
                  {isEditingDates ? (
                    <div className="mobile-form-row" style={{ display: 'flex', gap: '8px' }}>
                      <input className="mobile-form-col" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#555' }} />
                      <input className="mobile-form-col" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#555' }} />
                    </div>
                  ) : (
                    <div className="mobile-form-row" style={{ display: 'flex', gap: '8px' }}>
                      <div className="mobile-form-col" style={{ background: '#dcdcdc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#111', textAlign: 'center' }}>{endDate || 'None'}</div>
                      <div className="mobile-form-col" style={{ background: '#dcdcdc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#111', textAlign: 'center' }}>{endTime || '--:--'}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #dcdcdc', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>Registration Deadline</div>
                  {isEditingDates ? (
                    <div className="mobile-form-row" style={{ display: 'flex', gap: '8px' }}>
                      <input className="mobile-form-col" type="date" value={regDeadlineDate} onChange={e => setRegDeadlineDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#555' }} />
                      <input className="mobile-form-col" type="time" value={regDeadlineTime} onChange={e => setRegDeadlineTime(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#555' }} />
                    </div>
                  ) : (
                    <div className="mobile-form-row" style={{ display: 'flex', gap: '8px' }}>
                      <div className="mobile-form-col" style={{ background: '#dcdcdc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#111', textAlign: 'center' }}>{regDeadlineDate || 'None'}</div>
                      <div className="mobile-form-col" style={{ background: '#dcdcdc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#111', textAlign: 'center' }}>{regDeadlineTime || '--:--'}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111' }}>Location</h4>
              <button onClick={async () => {
                if (isEditingLocation) {
                  await saveEvent({ location: selectedMockLocation?.title || '' });
                }
                setIsEditingLocation(!isEditingLocation)
              }} style={{ background: isEditingLocation ? '#111' : '#d1d5db', color: isEditingLocation ? '#fff' : '#4b5563', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isEditingLocation ? <><Check size={14} /> Done</> : <><Edit2 size={14} /> Edit</>}
              </button>
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: isEditingLocation && !selectedMockLocation ? 'pointer' : 'default', background: '#fff', padding: '12px', borderRadius: '8px' }}
              onClick={() => {
                if (isEditingLocation && !selectedMockLocation) setIsLocationExpanded(true);
              }}
            >
              <MapPin size={20} color="#888" />
              <div style={{ flex: 1 }}>
                {selectedMockLocation ? (
                  <>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>{selectedMockLocation.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMockLocation.subtitle}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Add Event Location</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Offline location or virtual link</div>
                  </>
                )}
              </div>
              {isEditingLocation && selectedMockLocation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMockLocation(null);
                    setLocationSearchTerm('');
                    setIsLocationExpanded(true);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Expanded Search State (Only shows in edit mode) */}
            {isEditingLocation && !selectedMockLocation && isLocationExpanded && (
              <div style={{ marginTop: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                <input
                  autoFocus
                  placeholder="Enter location or virtual link"
                  value={locationSearchTerm}
                  onChange={e => setLocationSearchTerm(e.target.value)}
                  style={{ width: '100%', background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.1)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 600, color: '#555', outline: 'none' }}
                />

                {/* Mock Search Results */}
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {locationSearchTerm.trim() !== '' && (
                    <div
                      onClick={() => {
                        setSelectedMockLocation({ id: 'custom', title: locationSearchTerm, subtitle: 'Manual Location' });
                        setIsLocationExpanded(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '8px', cursor: 'pointer', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }}
                    >
                      <MapPin size={16} color="#888" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#555' }}>Use "{locationSearchTerm}"</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Add location manually</div>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', marginTop: locationSearchTerm.trim() !== '' ? '0.5rem' : '0' }}>Recent Locations</div>
                  {MOCK_LOCATIONS.filter(loc => loc.title.toLowerCase().includes(locationSearchTerm.toLowerCase())).map(loc => (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedMockLocation(loc);
                        setIsLocationExpanded(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '8px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                    >
                      <MapPin size={16} color="#888" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#555' }}>{loc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Preview */}
            {selectedMockLocation && (
              <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginTop: '0.5rem', background: '#ccc' }}>
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMockLocation.title)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>

          {/* Participant Type */}
          <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>Participant type</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <select value={participantType} onChange={e => setParticipantType(e.target.value as 'individual' | 'team')} style={{ background: 'transparent', border: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#111', outline: 'none', cursor: 'pointer' }}>
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                </select>
                <button onClick={() => saveEvent({ participantType, teamMin, teamMax })} style={{ background: '#111', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Save</button>
              </div>
            </div>

            {participantType === 'team' && (
              <div style={{ borderTop: '1px solid #dcdcdc', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Team Members per Team</span>
                <input type="number" min={1} max={20} value={teamMax} onChange={e => { const val = Number(e.target.value); setTeamMax(val); setTeamMin(val); }} style={{ width: '80px', background: '#dcdcdc', border: 'none', borderRadius: '4px', padding: '6px', textAlign: 'center', fontWeight: 700 }} />
              </div>
            )}
          </div>

          {/* Max Capacity Limit */}
          <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>Max Participant Capacity</div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Enter limit (e.g. 100) or leave empty for Unlimited</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 10px', width: '110px', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                />
                <button
                  onClick={async () => {
                    const capNum = capacity ? Number(capacity) : 0;
                    const success = await saveEvent({ capacity: capNum });
                    if (success) alert('Max participant capacity updated successfully!');
                  }}
                  style={{ background: '#111', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Description Card */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">About Event</h3>
          <button className="add-btn" onClick={async () => {
            if (isEditingDesc) await saveEvent({ description });
            setIsEditingDesc(!isEditingDesc);
          }}>
            {isEditingDesc ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>
        {isEditingDesc ? (
          <RichTextEditor value={description} onChange={setDescription} minHeight="140px" />
        ) : (
          <div
            style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: description || 'No description provided.' }}
          />
        )}
      </div>

      {/* Eligibility Card */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">Eligibility Criteria</h3>
          <button className="add-btn" onClick={async () => {
            if (isEditingElig) await saveEvent({ eligibility: eligYears });
            setIsEditingElig(!isEditingElig);
          }}>
            {isEditingElig ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>
        {isEditingElig ? (
          <textarea value={eligYears} onChange={e => setEligYears(e.target.value)} style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem' }} />
        ) : (
          <div style={{ fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{eligYears}</div>
        )}
      </div>

      {/* Target Department Card */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">Target Department</h3>
          <button className="add-btn" onClick={async () => {
            if (isEditingDept) await saveEvent({ targetDepartment });
            setIsEditingDept(!isEditingDept);
          }}>
            {isEditingDept ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>
        {isEditingDept ? (
          <select value={targetDepartment} onChange={e => setTargetDepartment(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem', outline: 'none' }}>
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{targetDepartment === 'All' ? 'Open to all departments' : targetDepartment}</div>
        )}
      </div>

      {/* Timeline Card */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">Stages & Timeline</h3>
          <button className="add-btn" onClick={() => setShowAddTimeline(!showAddTimeline)}><Plus size={14} /> Add Timeline</button>
        </div>

        {showAddTimeline && (
          <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #eaeaea' }}>
            <input placeholder="Stage Title (e.g. Registration Opens)" value={newTimeline.title} onChange={e => setNewTimeline({ ...newTimeline, title: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input type="date" value={newTimeline.start} onChange={e => setNewTimeline({ ...newTimeline, start: e.target.value })} style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="date" value={newTimeline.end} onChange={e => setNewTimeline({ ...newTimeline, end: e.target.value })} style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <textarea placeholder="Description" value={newTimeline.desc} onChange={e => setNewTimeline({ ...newTimeline, desc: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px' }} />
            <button onClick={handleAddTimeline} style={{ background: '#111', color: '#fff', padding: '8px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Save Stage</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '14px' }}>
          {timeline.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
              {i !== timeline.length - 1 && <div style={{ position: 'absolute', left: '16px', top: '30px', bottom: '-20px', borderLeft: '2px dotted #ccc' }} />}
              <div style={{ zIndex: 1, background: i % 2 === 0 ? '#fdf2f8' : '#eff6ff', border: `1px solid ${i % 2 === 0 ? '#fbcfe8' : '#bfdbfe'}`, borderRadius: '8px', padding: '4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: i % 2 === 0 ? '#ec4899' : '#3b82f6', textTransform: 'uppercase' }}>
                  {item.startDate ? new Date(item.startDate.split(',')[0]).toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'DATE'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111', lineHeight: '1' }}>
                  {item.startDate ? new Date(item.startDate.split(',')[0]).getDate() || item.date?.split(' ')[0] : item.date?.split(' ')[0] || ''}
                </div>
              </div>
              <div style={{ flex: 1, paddingBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#111' }}>{item.startDate}</span>
                  <span style={{ color: '#888' }}>→</span>
                  <span style={{ color: '#888' }}>{item.endDate}</span>
                </div>
                <div style={{ background: '#fafafa', border: '1px solid #eaeaea', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', wordBreak: 'break-word' }}>{item.title}</h4>
                    <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={async () => {
                      const updated = timeline.filter(t => t.id !== item.id);
                      setTimeline(updated);
                      await saveEvent({ timeline: updated });
                    }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Docs Card */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">Custom Itinerary & Additional Docs</h3>
          <button className="add-btn" onClick={() => document.getElementById('file-upload')?.click()}>
            <Plus size={14} /> Upload File
          </button>
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            accept=".pdf, image/*" 
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const res = await api.post('/events/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  const newDoc = {
                    name: res.data.name || file.name,
                    url: res.data.url,
                    type: res.data.type || file.type
                  };
                  const updated = [...additionalDocs, newDoc];
                  setAdditionalDocs(updated);
                  await saveEvent({ additionalDocs: updated });
                } catch (err) {
                  console.error('Upload failed', err);
                  alert('Upload failed');
                }
              }
            }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {additionalDocs.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eaeaea' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {doc.type?.includes('pdf') ? <FileText size={20} color="#ef4444" /> : <ImageIcon size={20} color="#3b82f6" />}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{doc.type?.includes('pdf') ? 'PDF Document' : 'Image'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#111' }}><Download size={16} /></a>
                <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={async () => {
                  const updated = additionalDocs.filter((_, idx) => idx !== i);
                  setAdditionalDocs(updated);
                  await saveEvent({ additionalDocs: updated });
                }} />
              </div>
            </div>
          ))}
          {additionalDocs.length === 0 && (
             <div style={{ color: '#888', fontSize: '0.9rem', padding: '1rem 0' }}>No additional documents uploaded.</div>
          )}
        </div>
      </div>

      {/* Rules Card */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">Rules</h3>
          <button className="add-btn" onClick={async () => {
            if (isEditingRules) await saveEvent({ rules });
            setIsEditingRules(!isEditingRules);
          }}>
            {isEditingRules ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>
        {isEditingRules ? (
          <RichTextEditor value={rules} onChange={setRules} minHeight="140px" />
        ) : (
          <div
            style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: rules || 'No rules provided.' }}
          />
        )}
      </div>

      {/* Target Visibility Settings Card */}      {/* Event Visibility Settings Card */}
      <div className="card-container" style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#111' }}>Event Visibility Settings</h3>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '4px 0 0 0' }}>Control whether this event is public or link-only</p>
          </div>
          <button
            onClick={async () => {
              setIsSavingTargetVis(true);
              const success = await saveEvent({
                visibility,
                allowMultipleRegistrations
              });
              setIsSavingTargetVis(false);
              if (success) {
                alert('Visibility & Registration settings saved successfully!');
              }
            }}
            disabled={isSavingTargetVis}
            style={{
              background: isSavingTargetVis ? '#555' : '#111',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: isSavingTargetVis ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} /> {isSavingTargetVis ? 'Saving...' : 'Save Visibility Settings'}
          </button>
        </div>

        {/* Toggle Switch */}
        <div style={{ background: '#fafafa', border: '1px solid #eaeaea', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color={visibility === 'Unlisted' ? '#8B5CF6' : '#888'} />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>
                Private Direct Link Only (Unlisted Event)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                {visibility === 'Unlisted'
                  ? 'ON: Hidden from Home Page & Portals. Accessible ONLY via direct URL link.'
                  : 'OFF: Visible to normal users on Home Page & Portals as usual.'}
              </div>
            </div>
          </div>
          <div
            onClick={() => setVisibility(visibility === 'Unlisted' ? 'Public' : 'Unlisted')}
            style={{ width: '44px', height: '24px', background: visibility === 'Unlisted' ? '#8B5CF6' : '#ccc', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
          >
            <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: visibility === 'Unlisted' ? '23px' : '3px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* Multiple Registrations Toggle Switch */}
        <div style={{ background: '#fafafa', border: '1px solid #eaeaea', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Repeat size={20} color={allowMultipleRegistrations ? '#8B5CF6' : '#888'} />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>
                Allow Multiple Registrations per User
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                {allowMultipleRegistrations
                  ? 'ON: Single user can register multiple times for this event.'
                  : 'OFF: Default restriction. Users can register only once.'}
              </div>
            </div>
          </div>
          <div
            onClick={() => setAllowMultipleRegistrations(!allowMultipleRegistrations)}
            style={{ width: '44px', height: '24px', background: allowMultipleRegistrations ? '#8B5CF6' : '#ccc', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
          >
            <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: allowMultipleRegistrations ? '23px' : '3px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {visibility === 'Unlisted' && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
            <div style={{ fontSize: '0.825rem', color: '#1e40af' }}>
              <strong>🔗 Direct Link Access Enabled:</strong> Anyone with the event URL can view details and register for this event.
            </div>
            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/${getEventDetailHash(event)}`;
                navigator.clipboard.writeText(link);
                alert('Direct Event URL copied to clipboard!\n\n' + link);
              }}
            >
              Copy Event URL
            </button>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="card-container">
        <div className="card-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">Contact Information</h3>
            <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '4px' }}>Contact details:</div>
          </div>
          <button style={{ background: '#eaeaea', color: '#555', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setContacts([...contacts, { id: Date.now(), name: '', email: '', phone: '', isEditing: true }])}>
            Add Coordinator <ChevronDown size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          {contacts.map((c, idx) => (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
              {idx > 0 && <div style={{ borderTop: '1px solid #eaeaea', marginBottom: '0.5rem' }}></div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={async () => {
                  const nc = [...contacts]; const f = nc.find(x => x.id === c.id);
                  if (f) f.isEditing = !f.isEditing;
                  setContacts(nc);
                  if (f && !f.isEditing) await saveEvent({ contacts: nc });
                }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {c.isEditing ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
                </button>
                <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={async () => {
                  const nc = contacts.filter(con => con.id !== c.id);
                  setContacts(nc);
                  await saveEvent({ contacts: nc });
                }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', background: '#fdf2f8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#ec4899" /></div>
                {c.isEditing ? <input placeholder="Name" value={c.name} onChange={e => { const nc = [...contacts]; const f = nc.find(x => x.id === c.id); if (f) f.name = e.target.value; setContacts(nc); }} style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }} /> : <span style={{ fontSize: '0.9rem', color: '#111' }}>{c.name || 'Name'}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', background: '#eff6ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color="#3b82f6" /></div>
                {c.isEditing ? <input placeholder="Phone" value={c.phone} onChange={e => { const nc = [...contacts]; const f = nc.find(x => x.id === c.id); if (f) f.phone = e.target.value; setContacts(nc); }} style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }} /> : <span style={{ fontSize: '0.9rem', color: '#111' }}>{c.phone || 'Phone'}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', background: '#f3e8ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color="#9333ea" /></div>
                {c.isEditing ? <input placeholder="Email" value={c.email} onChange={e => { const nc = [...contacts]; const f = nc.find(x => x.id === c.id); if (f) f.email = e.target.value; setContacts(nc); }} style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }} /> : <span style={{ fontSize: '0.9rem', color: '#111' }}>{c.email || 'Email'}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Distribution */}
      <div className="card-container">
        <div className="card-header">
          <h3 className="card-title">Prize and Rewards Detail</h3>
          <button className="add-btn" onClick={() => setIsAddingPrize(!isAddingPrize)} style={{ background: '#eaeaea', color: '#555', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            Add Prize <ChevronDown size={14} />
          </button>
        </div>

        {!isAddingPrize ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {prizes.length === 0 ? (
              <div style={{ color: '#888', fontSize: '0.9rem' }}>No prizes added yet.</div>
            ) : (
              prizes.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Trophy size={18} color={p.position?.includes('1') ? '#ec4899' : p.position?.includes('2') ? '#3b82f6' : '#9333ea'} />
                    <span style={{ fontSize: '0.9rem', color: '#111', fontWeight: 600 }}>{p.position}: {p.rewardType} {p.amount ? `- ${p.amount}` : ''}</span>
                  </div>
                  <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={async () => {
                    const updated = prizes.filter((_, idx) => idx !== i);
                    setPrizes(updated);
                    await saveEvent({ prizes: updated });
                  }} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ background: '#dcdcdc', padding: '2rem', borderRadius: '12px', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Trophy size={32} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111', margin: '0 0 0.5rem 0' }}>Add Prize</h2>
            </div>

            <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: '6px', display: 'block' }}>Reward Type</label>
                <select value={newPrize.rewardType} onChange={e => setNewPrize({ ...newPrize, rewardType: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', background: '#eaeaea', fontWeight: 600, color: '#555' }}>
                  <option value="Cash Prize">Cash Prize</option>
                  <option value="Goodies">Goodies</option>
                  <option value="Certificate">Certificate</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: '6px', display: 'block' }}>For Position</label>
                <select value={newPrize.position} onChange={e => setNewPrize({ ...newPrize, position: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', background: '#eaeaea', fontWeight: 600, color: '#555' }}>
                  <option value="1st Place">1st Place</option>
                  <option value="2nd Place">2nd Place</option>
                  <option value="3rd Place">3rd Place</option>
                  <option value="Participation">Participation</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: '6px', display: 'block' }}>Amount / Details</label>
                <input value={newPrize.amount} onChange={e => setNewPrize({ ...newPrize, amount: e.target.value })} placeholder="Example: ₹50,000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', background: '#eaeaea', fontWeight: 600, color: '#555' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={() => setIsAddingPrize(false)} style={{ flex: 1, background: 'transparent', color: '#111', border: '1px solid #ccc', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={async () => {
                  if (newPrize.rewardType && newPrize.position) {
                    const updated = [...prizes, newPrize];
                    const success = await saveEvent({ prizes: updated });
                    if (success) {
                      setPrizes(updated);
                      setNewPrize({ rewardType: 'Cash Prize', position: '1st Place', amount: '' });
                      setIsAddingPrize(false);
                    }
                  }
                }} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Add Reward</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// -------------------------------------------------------------
// REGISTRATION TAB
// -------------------------------------------------------------
function RegistrationTab({ event, saveEvent }: { event: any, saveEvent: any }) {
  const [] = useState(event?.capacity?.toString() || '100');
  const [partType, setPartType] = useState(event?.participantType === 'team' ? 'Team' : 'Individual');
  const [teamMin, setTeamMin] = useState(event?.teamMin?.toString() || '1');
  const [teamMax, setTeamMax] = useState(event?.teamMax?.toString() || '4');
  const [externalLink, setExternalLink] = useState(event?.externalRegistrationLink || '');
  const [regWindow, setRegWindow] = useState(event?.registrationStatus || 'Open');

  const [tickets, setTickets] = useState<any[]>(event?.tickets?.length > 0 ? event.tickets : [{ id: 1, category: 'General Pass', price: 'Free' }]);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: '', price: '' });

  const [personalInfo, setPersonalInfo] = useState<any[]>(event?.personalInfo?.length > 0 ? event.personalInfo : [
    { id: 1, name: 'Name', required: 'Required' },
    { id: 2, name: 'Email', required: 'Required' },
    { id: 3, name: 'Mobile Number', required: 'Optional' }
  ]);
  const [isAddingPersonal, setIsAddingPersonal] = useState(false);
  const [newPersonalField, setNewPersonalField] = useState('');

  const [eduInfo, setEduInfo] = useState<any[]>(event?.eduInfo?.length > 0 ? event.eduInfo : [
    { id: 1, name: 'Roll Number', required: 'Optional' },
    { id: 2, name: 'Course', required: 'Optional' },
    { id: 3, name: 'Branch', required: 'Optional' },
    { id: 4, name: 'Year', required: 'Off' }
  ]);
  const [isAddingEdu, setIsAddingEdu] = useState(false);
  const [newEduField, setNewEduField] = useState('');

  const [formMode, setFormMode] = useState<'builtin' | 'external' | 'multipage'>(event?.formMode || (event?.externalRegistrationLink ? 'external' : 'builtin'));
  const [formSections, setFormSections] = useState<any[]>(event?.formSections?.length > 0 ? event.formSections : [
    { id: 'sec-1', title: 'Page 1: Basic Information', description: 'Please fill in your basic details', questions: [] },
    { id: 'sec-2', title: 'Page 2: Event Questions', description: 'Additional questions for this event', questions: [] }
  ]);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  const [secQuestion, setSecQuestion] = useState<any>({ question: '', type: 'Text', required: 'Optional', options: [] });
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  const [customQuestions, setCustomQuestions] = useState<any[]>(event?.customQuestions?.length > 0 ? event.customQuestions : []);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<any>({ question: '', type: 'Text', required: 'Optional', options: [] });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card-hover" style={{ background: '#fff', border: '1px solid #eaeaea', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} color="#3b82f6" /></div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>Registration window</div>
            <select value={regWindow} onChange={(e) => setRegWindow(e.target.value)} style={{ fontSize: '0.8rem', color: '#111', border: '1px solid #eaeaea', background: '#f8fafc', outline: 'none', padding: '4px 8px', marginTop: '4px', cursor: 'pointer', borderRadius: '4px' }}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
              <option value="Not Yet Started">Not Yet Started</option>
            </select>
          </div>
        </div>
        <div className="card-hover" style={{ background: '#fff', border: '1px solid #eaeaea', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', background: '#f3e8ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color="#a855f7" /></div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>Participation type</div>
            <select value={partType} onChange={(e) => setPartType(e.target.value)} style={{ fontSize: '0.8rem', color: '#111', border: '1px solid #eaeaea', background: '#f8fafc', outline: 'none', padding: '4px 8px', marginTop: '4px', cursor: 'pointer', borderRadius: '4px' }}>
              <option value="Individual">Individual</option>
              <option value="Team">Team</option>
            </select>
            {partType === 'Team' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Members per Team:</span>
                <input type="number" min="1" max="20" value={teamMax} onChange={e => { setTeamMax(e.target.value); setTeamMin(e.target.value); }} style={{ width: '60px', padding: '4px 8px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '4px', border: '1px solid #ccc', outline: 'none', textAlign: 'center' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#111' }}>Tickets</h3>
          <button onClick={() => setIsAddingTicket(!isAddingTicket)} style={{ background: '#eaeaea', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Plus size={14} /> Add Ticket</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tickets.map(t => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #eaeaea', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: '#111', fontSize: '0.95rem' }}>{t.category}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{t.price === 'Free' || t.price.toLowerCase() === 'free' ? 'Free' : (t.price.includes('₹') ? t.price : '₹' + t.price)}</div>
                <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={async () => {
                  const updated = tickets.filter(ticket => ticket.id !== t.id);
                  setTickets(updated);
                  await saveEvent({ tickets: updated });
                }} />
              </div>
            </div>
          ))}

          {isAddingTicket && (
            <div style={{ background: '#fff', border: '1px dashed #ccc', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Category Name" value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#111' }}>₹</span>
                <input type="text" placeholder="Price (in INR)" value={newTicket.price} onChange={e => setNewTicket({ ...newTicket, price: e.target.value })} style={{ width: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <button onClick={async () => {
                if (newTicket.category) {
                  const updated = [...tickets, { id: Date.now(), ...newTicket }];
                  const success = await saveEvent({ tickets: updated });
                  if (success) {
                    setTickets(updated);
                    setNewTicket({ category: '', price: '' });
                    setIsAddingTicket(false);
                  }
                }
              }} style={{ background: '#111', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          )}
        </div>
      </div>

      {/* Registration Questions */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#111' }}>Registration Questions</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>We will ask guests the following questions when they register for the event.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Personal Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>
                <User size={16} color="#ec4899" /> Personal Information
              </div>
              <button onClick={() => setIsAddingPersonal(!isAddingPersonal)} className="add-btn"><Plus size={14} /> Add Field</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {personalInfo.map(info => (
                <div key={info.name || info.id || crypto.randomUUID()} style={{ border: '1px solid #eaeaea', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>{info.name}</span>
                  <select value={info.required} onChange={async (e) => {
                    const updated = personalInfo.map(i => i.name === info.name ? { ...i, required: e.target.value } : i);
                    setPersonalInfo(updated);
                    await saveEvent({ personalInfo: updated });
                  }} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', color: '#888', cursor: 'pointer' }}>
                    <option value="Required">Required</option>
                    <option value="Optional">Optional</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
              ))}

              {isAddingPersonal && (
                <div style={{ border: '1px dashed #ccc', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder="Field name" value={newPersonalField} onChange={e => setNewPersonalField(e.target.value)} style={{ width: '100%', padding: '4px', border: 'none', outline: 'none', fontSize: '0.9rem' }} autoFocus />
                  <button onClick={async () => {
                    if (newPersonalField) {
                      const updated = [...personalInfo, { id: Date.now(), name: newPersonalField, required: 'Optional' }];
                      const success = await saveEvent({ personalInfo: updated });
                      if (success) {
                        setPersonalInfo(updated);
                        setNewPersonalField('');
                        setIsAddingPersonal(false);
                      }
                    }
                  }} style={{ background: '#111', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                </div>
              )}
            </div>
          </div>

          {/* Educational Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>
                <CheckCircle size={16} color="#3b82f6" /> Educational Information
              </div>
              <button onClick={() => setIsAddingEdu(!isAddingEdu)} className="add-btn"><Plus size={14} /> Add Field</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {eduInfo.map(info => (
                <div key={info.name || info.id || crypto.randomUUID()} style={{ border: '1px solid #eaeaea', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>{info.name}</span>
                  <select value={info.required} onChange={async (e) => {
                    const updated = eduInfo.map(i => i.name === info.name ? { ...i, required: e.target.value } : i);
                    setEduInfo(updated);
                    await saveEvent({ eduInfo: updated });
                  }} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', color: '#888', cursor: 'pointer' }}>
                    <option value="Required">Required</option>
                    <option value="Optional">Optional</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
              ))}

              {isAddingEdu && (
                <div style={{ border: '1px dashed #ccc', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder="Field name" value={newEduField} onChange={e => setNewEduField(e.target.value)} style={{ width: '100%', padding: '4px', border: 'none', outline: 'none', fontSize: '0.9rem' }} autoFocus />
                  <button onClick={async () => {
                    if (newEduField) {
                      const updated = [...eduInfo, { id: Date.now(), name: newEduField, required: 'Optional' }];
                      setEduInfo(updated);
                      await saveEvent({ eduInfo: updated });
                      setNewEduField('');
                      setIsAddingEdu(false);
                    }
                  }} style={{ background: '#111', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                </div>
              )}
            </div>
          </div>

          {/* Registration Form Mode Selection */}
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #eaeaea', marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#111' }}>Registration Form Mode</h3>
              <p style={{ margin: '0', fontSize: '0.85rem', color: '#666' }}>Select how participants register for this event.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>
                <input 
                  type="radio" 
                  name="manageRegMode" 
                  checked={formMode === 'builtin'} 
                  onChange={() => {
                    setFormMode('builtin');
                    setExternalLink('');
                  }} 
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#111' }}
                />
                Standard Built-in Form (Single Page)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>
                <input 
                  type="radio" 
                  name="manageRegMode" 
                  checked={formMode === 'multipage'} 
                  onChange={() => {
                    setFormMode('multipage');
                    setExternalLink('');
                  }} 
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#111' }}
                />
                Multi-Page / Section Form (Google Form style)
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>
                <input 
                  type="radio" 
                  name="manageRegMode" 
                  checked={formMode === 'external'} 
                  onChange={() => {
                    setFormMode('external');
                    if (!externalLink) setExternalLink('https://');
                  }} 
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#111' }}
                />
                External Link (e.g. Google Form)
              </label>
            </div>
          </div>

          {/* External Registration Link */}
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #eaeaea', marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#111' }}>External Registration Link</h3>
                <p style={{ margin: '0', fontSize: '0.85rem', color: '#666' }}>Redirect users to an external form (e.g. Google Form, Razorpay)</p>
              </div>
              {externalLink ? (
                <button type="button" onClick={() => setExternalLink('')} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <X size={14} /> Remove Link
                </button>
              ) : null}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
            </div>
          </div>

          {/* Multi-Page / Section Form Builder */}
          {formMode === 'multipage' ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Multi-Page / Section Form Builder</h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '4px 0 0 0' }}>Configure pages & sections. Users will navigate step-by-step through each page like Google Forms.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSec = {
                      id: String(Date.now()),
                      title: `Page ${formSections.length + 1}: Section Title`,
                      description: 'Provide instructions for this section',
                      questions: []
                    };
                    const updated = [...formSections, newSec];
                    setFormSections(updated);
                  }}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add New Page / Section
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {formSections.map((sec: any, sIdx: number) => (
                  <div key={sec.id || sIdx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Section {sIdx + 1} of {formSections.length}</span>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const updated = [...formSections];
                            updated[sIdx].title = e.target.value;
                            setFormSections(updated);
                          }}
                          placeholder="Page / Section Title"
                          style={{ fontSize: '1.05rem', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                        />
                        <input
                          type="text"
                          value={sec.description}
                          onChange={(e) => {
                            const updated = [...formSections];
                            updated[sIdx].description = e.target.value;
                            setFormSections(updated);
                          }}
                          placeholder="Section Description / Instructions (optional)"
                          style={{ fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', color: '#64748b' }}
                        />
                      </div>
                      {formSections.length > 1 && (
                        <Trash2
                          size={18}
                          color="#EF4444"
                          style={{ cursor: 'pointer', marginTop: '8px' }}
                          onClick={() => {
                            const updated = formSections.filter((_: any, idx: number) => idx !== sIdx);
                            setFormSections(updated);
                          }}
                        />
                      )}
                    </div>

                    {/* Questions in Section */}
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>Questions in Section {sIdx + 1}:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(sec.questions || []).map((q: any, qIdx: number) => (
                          <div key={q.id || qIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{q.question}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                Type: <b>{q.type}</b>{q.type !== 'Header Text / Note' && <> | <b>{q.required}</b></>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Edit2
                                size={16}
                                color="#3b82f6"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setActiveSectionIdx(sIdx);
                                  setEditingQuestionIdx(qIdx);
                                  setSecQuestion({ ...q });
                                }}
                              />
                              <Trash2
                                size={16}
                                color="#EF4444"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  const updated = [...formSections];
                                  updated[sIdx].questions = updated[sIdx].questions.filter((_: any, idx: number) => idx !== qIdx);
                                  setFormSections(updated);
                                }}
                              />
                            </div>
                          </div>
                        ))}

                        {activeSectionIdx === sIdx ? (
                          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                            {secQuestion.type === 'Header Text / Note' ? (
                              <textarea
                                rows={3}
                                placeholder="Type heading, instructions, or rules for this page..."
                                value={secQuestion.question}
                                onChange={e => setSecQuestion({ ...secQuestion, question: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder="Type question for this page"
                                value={secQuestion.question}
                                onChange={e => setSecQuestion({ ...secQuestion, question: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
                              />
                            )}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <select value={secQuestion.type} onChange={e => setSecQuestion({ ...secQuestion, type: e.target.value, required: e.target.value === 'Header Text / Note' ? 'Optional' : secQuestion.required })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', flex: 1 }}>
                                <option value="Text">Text (Short Answer)</option>
                                <option value="Dropdown">Dropdown</option>
                                <option value="Checkbox">Checkbox</option>
                                <option value="File Upload">File Upload</option>
                                <option value="Header Text / Note">Header Text / Note (Static Info)</option>
                                <option value="Special Dropdown (Page Navigation)">Special Dropdown (Page Navigation)</option>
                              </select>
                              {secQuestion.type !== 'Header Text / Note' && (
                                <select value={secQuestion.required} onChange={e => setSecQuestion({ ...secQuestion, required: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', flex: 1 }}>
                                  <option value="Required">Required</option>
                                  <option value="Optional">Optional</option>
                                </select>
                              )}
                            </div>

                            {(secQuestion.type === 'Checkbox' || secQuestion.type === 'Dropdown' || secQuestion.type === 'Special Dropdown (Page Navigation)') && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                  Options {secQuestion.type === 'Special Dropdown (Page Navigation)' && '& Target Page Mappings'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(secQuestion.options || []).map((opt: any, idx: number) => {
                                    const label = typeof opt === 'object' && opt !== null ? opt.label : String(opt);
                                    const targetSectionId = typeof opt === 'object' && opt !== null ? opt.targetSectionId : '';
                                    const targetSectionObj = formSections.find((s: any) => s.id === targetSectionId || s.title === targetSectionId);
                                    const targetName = targetSectionObj ? targetSectionObj.title : (targetSectionId === 'submit' ? 'Submit Form (End)' : 'Next Page (Default)');

                                    return (
                                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{label}</span>
                                          {secQuestion.type === 'Special Dropdown (Page Navigation)' && (
                                            <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                                              ➜ {targetName}
                                            </span>
                                          )}
                                        </div>
                                        <X size={16} color="#ef4444" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSecQuestion({ ...secQuestion, options: (secQuestion.options || []).filter((_: any, i: number) => i !== idx) })} />
                                      </div>
                                    );
                                  })}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
                                  <input
                                    type="text"
                                    placeholder="Option text (e.g. Option A)"
                                    id={`sec-option-input-${sIdx}`}
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', flex: 1, minWidth: '150px', outline: 'none' }}
                                  />
                                  {secQuestion.type === 'Special Dropdown (Page Navigation)' && (
                                    <select
                                      id={`sec-option-target-${sIdx}`}
                                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', flex: 1, minWidth: '180px', outline: 'none', background: '#fff' }}
                                    >
                                      <option value="">Next Page (Default)</option>
                                      {formSections.map((secItem: any, secIdx: number) => (
                                        <option key={secItem.id || secIdx} value={secItem.id || secItem.title}>
                                          Section {secIdx + 1}: {secItem.title}
                                        </option>
                                      ))}
                                      <option value="submit">Submit Form (End of Form)</option>
                                    </select>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`sec-option-input-${sIdx}`) as HTMLInputElement;
                                      const targetSelect = document.getElementById(`sec-option-target-${sIdx}`) as HTMLSelectElement | null;
                                      if (input && input.value.trim()) {
                                        const labelStr = input.value.trim();
                                        const targetVal = targetSelect ? targetSelect.value : '';
                                        const currentOptions = secQuestion.options || [];
                                        const newOpt = secQuestion.type === 'Special Dropdown (Page Navigation)'
                                          ? { label: labelStr, targetSectionId: targetVal }
                                          : labelStr;

                                        setSecQuestion({ ...secQuestion, options: [...currentOptions, newOpt] });
                                        input.value = '';
                                        if (targetSelect) targetSelect.value = '';
                                      }
                                    }}
                                    style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                                  >
                                    Add Option
                                  </button>
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                              <button onClick={() => { setActiveSectionIdx(null); setEditingQuestionIdx(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                              <button onClick={() => {
                                if (secQuestion.question) {
                                  const updated = [...formSections];
                                  if (editingQuestionIdx !== null) {
                                    updated[sIdx].questions[editingQuestionIdx] = { ...secQuestion };
                                  } else {
                                    updated[sIdx].questions = [...(updated[sIdx].questions || []), { id: String(Date.now()), ...secQuestion }];
                                  }
                                  setFormSections(updated);
                                  setSecQuestion({ question: '', type: 'Text', required: 'Optional', options: [] });
                                  setActiveSectionIdx(null);
                                  setEditingQuestionIdx(null);
                                }
                              }} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>{editingQuestionIdx !== null ? 'Update Question' : 'Save Question'}</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSectionIdx(sIdx);
                              setEditingQuestionIdx(null);
                              setSecQuestion({ question: '', type: 'Text', required: 'Optional', options: [] });
                            }}
                            style={{ background: '#f1f5f9', color: '#334155', border: '1px dashed #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                          >
                            <Plus size={14} /> Add Question to Page {sIdx + 1}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Questions (Single Page Standard Form) */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: '#111', marginBottom: '1rem' }}>
                <Edit2 size={16} color="#a855f7" /> Custom Questions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {customQuestions.map(q => (
                  <div key={q.question || q.id || crypto.randomUUID()} style={{ border: '1px solid #eaeaea', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <LayoutGrid size={16} color="#888" />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>{q.question}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{q.type} | {q.required}</div>
                      </div>
                    </div>
                    <Trash2 onClick={async () => {
                      const updated = customQuestions.filter(c => c.question !== q.question);
                      setCustomQuestions(updated);
                      await saveEvent({ customQuestions: updated });
                    }} size={16} color="#ef4444" style={{ cursor: 'pointer' }} />
                  </div>
                ))}

                {isAddingQuestion && (
                  <div style={{ border: '1px dashed #ccc', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {newQuestion.type === 'Header Text / Note' ? (
                      <textarea
                        rows={3}
                        placeholder="Type heading, instructions, or rules..."
                        value={newQuestion.question}
                        onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    ) : (
                      <input type="text" placeholder="Type your question here" value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    )}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <select value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value, required: e.target.value === 'Header Text / Note' ? 'Optional' : newQuestion.required })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}>
                        <option value="Text">Text (Short Answer)</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="Checkbox">Checkbox</option>
                        <option value="File Upload">File Upload</option>
                        <option value="Header Text / Note">Header Text / Note (Static Info)</option>
                      </select>
                      {newQuestion.type !== 'Header Text / Note' && (
                        <select value={newQuestion.required} onChange={e => setNewQuestion({ ...newQuestion, required: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}>
                          <option value="Required">Required</option>
                          <option value="Optional">Optional</option>
                        </select>
                      )}
                    </div>

                    {(newQuestion.type === 'Checkbox' || newQuestion.type === 'Dropdown') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Options</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {(newQuestion.options || []).map((opt: string, idx: number) => (
                            <div key={idx} style={{ background: '#f3e8ff', color: '#9333ea', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {opt} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setNewQuestion({ ...newQuestion, options: (newQuestion.options || []).filter((_: any, i: number) => i !== idx) })} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" placeholder="Add option" id="new-option-input" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }} />
                          <button type="button" onClick={() => {
                            const input = document.getElementById('new-option-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const currentOptions = newQuestion.options || [];
                              setNewQuestion({ ...newQuestion, options: [...currentOptions, input.value.trim()] });
                              input.value = '';
                            }
                          }} style={{ background: '#111', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Add Option</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button onClick={() => setIsAddingQuestion(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      <button onClick={async () => {
                        if (newQuestion.question) {
                          const updated = [...customQuestions, { id: Date.now(), ...newQuestion }];
                          const success = await saveEvent({ customQuestions: updated });
                          if (success) {
                            setCustomQuestions(updated);
                            setNewQuestion({ question: '', type: 'Text', required: 'Optional', options: [] });
                            setIsAddingQuestion(false);
                          }
                        }
                      }} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Question</button>
                    </div>
                  </div>
                )}
              </div>

              {!isAddingQuestion && (
                <button onClick={() => setIsAddingQuestion(true)} style={{ marginTop: '1rem', background: '#eaeaea', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Plus size={14} /> Add Question</button>
              )}
            </div>
          )}

        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #eaeaea', paddingTop: '1.5rem' }}>
        <button onClick={async () => {
          const updatePayload: any = { 
            participantType: partType === 'Team' ? 'team' : 'individual', 
            registrationStatus: regWindow, 
            externalRegistrationLink: externalLink,
            formMode,
            formSections
          };
          if (partType === 'Team') {
            const count = parseInt(teamMax) || 4;
            updatePayload.teamMin = count;
            updatePayload.teamMax = count;
          }
          await saveEvent(updatePayload);
          alert('Registration details saved successfully!');
        }} style={{ background: '#7c3aed', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
          Save Registration Details
        </button>
      </div>
    </div>
  );
}

const UserAvatar = ({ name, avatar, size = 36 }: { name?: string; avatar?: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const displayName = name || 'Participant';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'P';

  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt={displayName}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)'
      }}
    >
      {initial}
    </div>
  );
};

// -------------------------------------------------------------
// PARTICIPANTS TAB
// -------------------------------------------------------------
function ParticipantsTab({ event }: { event: any }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detailed'>('list');
  const [showCheckedInModal, setShowCheckedInModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParticipants = participants.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();

    if (p.name && p.name.toLowerCase().includes(q)) return true;
    if (p.email && p.email.toLowerCase().includes(q)) return true;
    if (p.phone && p.phone.toLowerCase().includes(q)) return true;
    if (p.type && p.type.toLowerCase().includes(q)) return true;
    if (p.status && p.status.toLowerCase().includes(q)) return true;

    if (p.answers && Array.isArray(p.answers)) {
      const hasMatchInAnswers = p.answers.some((a: any) => {
        const question = (a.question || '').toLowerCase();
        let ansStr = '';
        if (Array.isArray(a.answer)) {
          ansStr = a.answer.join(' ').toLowerCase();
        } else if (a.answer) {
          ansStr = String(a.answer).toLowerCase();
        }
        return question.includes(q) || ansStr.includes(q);
      });
      if (hasMatchInAnswers) return true;
    }

    if (p.teamMembers && Array.isArray(p.teamMembers)) {
      const hasMatchInTeam = p.teamMembers.some((m: any) => {
        if (m.name && m.name.toLowerCase().includes(q)) return true;
        if (m.email && m.email.toLowerCase().includes(q)) return true;
        if (m.phone && m.phone.toLowerCase().includes(q)) return true;
        if (m.customAnswers && Array.isArray(m.customAnswers)) {
          return m.customAnswers.some((ca: any) => {
            const caQ = (ca.question || '').toLowerCase();
            let caA = '';
            if (Array.isArray(ca.answer)) caA = ca.answer.join(' ').toLowerCase();
            else if (ca.answer) caA = String(ca.answer).toLowerCase();
            return caQ.includes(q) || caA.includes(q);
          });
        }
        return false;
      });
      if (hasMatchInTeam) return true;
    }

    return false;
  });



  useEffect(() => {
    let interval: any;
    const fetchParticipants = async () => {
      try {
        const { data } = await api.get(`/events/${event._id || event.id}/participants`);
        setParticipants(data);
      } catch (err) {
        console.error('Failed to load participants', err);
      } finally {
        setLoading(false);
      }
    };
    if (event) {
      fetchParticipants();
      interval = setInterval(fetchParticipants, 5000);
    }
    return () => clearInterval(interval);
  }, [event]);

  const handleDownloadData = () => {
    if (!participants || participants.length === 0) {
      alert("No data to download!");
      return;
    }

    // Collect all unique questions and check if standard fields exist
    const questionSet = new Set<string>();
    let hasName = false;
    let hasEmail = false;
    let hasPhone = false;

    participants.forEach(p => {
      if (p.name) hasName = true;
      if (p.email) hasEmail = true;
      if (p.phone) hasPhone = true;

      (p.answers || []).forEach((a: any) => {
        if (a.question) questionSet.add(a.question);
      });
    });
    const allQuestions = Array.from(questionSet);

    let headers = [];
    if (hasName) headers.push('Name');
    if (hasEmail) headers.push('Email');
    if (hasPhone) headers.push('Phone');
    headers.push('Ticket Type', 'Status');

    if (event?.generateQRCode) headers.push('Checked In');

    allQuestions.forEach(q => headers.push(`"${q.replace(/"/g, '""')}"`));

    let csvContent = headers.join(",") + "\n";

    participants.forEach(p => {
      let row = [];
      
      if (hasName) row.push(`"${(p.name || '').replace(/"/g, '""')}"`);
      if (hasEmail) row.push(`"${(p.email || '').replace(/"/g, '""')}"`);
      if (hasPhone) {
        if (p.phone && /^\+?\d{7,}$/.test(p.phone)) row.push(`="${p.phone.replace(/"/g, '""')}"`);
        else row.push(`"${(p.phone || '').replace(/"/g, '""')}"`);
      }
      
      row.push(p.type ? `"${p.type}"` : '""');
      row.push(p.status ? `"${p.status}"` : '""');

      if (event?.generateQRCode) {
        row.push(p.checkedIn ? '"Yes"' : '"No"');
      }

      allQuestions.forEach(q => {
        const ansObj = (p.answers || []).find((a: any) => a.question === q);
        let ansStr = ansObj?.answer || '';
        if (Array.isArray(ansStr)) ansStr = ansStr.join(', ');
        
        const strVal = ansStr.toString();
        if (/^\+?\d{7,}$/.test(strVal)) {
           row.push(`="${strVal.replace(/"/g, '""')}"`);
        } else {
           row.push(`"${strVal.replace(/"/g, '""')}"`);
        }
      });

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participants_${event?.title?.replace(/\\s+/g, '_') || 'event'}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {event?.generateQRCode && (
          <button onClick={() => setShowCheckedInModal(true)} style={{ flex: 1, minWidth: '150px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Users size={16} /> Check In Participants
          </button>
        )}
        <button
          onClick={() => {
            if (!event) return;
            const link = `${window.location.origin}/${getEventDetailHash(event)}`;
            navigator.clipboard.writeText(link).then(() => {
              alert('Event link copied to clipboard!');
            }).catch(() => {
              alert('Failed to copy link.');
            });
          }}
          style={{ flex: 1, minWidth: '150px', background: '#f3e8ff', color: '#a855f7', border: '1px solid #e9d5ff', padding: '12px', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <LinkIcon size={16} /> Share / Invite Link
        </button>
      </div>

      {/* Analytics Placeholder */}
      <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Registration Analytics</h3>
        </div>
        {/* Real Bar Chart */}
        {(() => {
          const total = Math.max(participants.length, 1);
          const checkedIn = participants.filter(p => p.checkedIn).length;
          const paid = participants.filter(p => p.type !== 'Free').length;
          const free = participants.filter(p => p.type === 'Free').length;

          return (
            <>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', width: '20%' }}>
                  <div style={{ fontWeight: 800, color: '#ec4899', fontSize: '1rem' }}>{participants.length}</div>
                  <div style={{ width: '100%', maxWidth: '40px', height: `${(participants.length / total) * 100}%`, background: '#ec4899', borderRadius: '4px 4px 0 0', minHeight: '4px' }} title="Total Registrations" />
                </div>
                {event?.generateQRCode && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', width: '20%' }}>
                    <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '1rem' }}>{checkedIn}</div>
                    <div style={{ width: '100%', maxWidth: '40px', height: `${(checkedIn / total) * 100}%`, background: '#22c55e', borderRadius: '4px 4px 0 0', minHeight: '4px' }} title="Checked In" />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', width: '20%' }}>
                  <div style={{ fontWeight: 800, color: '#3b82f6', fontSize: '1rem' }}>{paid}</div>
                  <div style={{ width: '100%', maxWidth: '40px', height: `${(paid / total) * 100}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0', minHeight: '4px' }} title="Paid Tickets" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', width: '20%' }}>
                  <div style={{ fontWeight: 800, color: '#8b5cf6', fontSize: '1rem' }}>{free}</div>
                  <div style={{ width: '100%', maxWidth: '40px', height: `${(free / total) * 100}%`, background: '#8b5cf6', borderRadius: '4px 4px 0 0', minHeight: '4px' }} title="Free Tickets" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', color: '#888', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ width: '20%', textAlign: 'center' }}>Total</span>
                {event?.generateQRCode && (
                  <span style={{ width: '20%', textAlign: 'center' }}>Checked In</span>
                )}
                <span style={{ width: '20%', textAlign: 'center' }}>Paid</span>
                <span style={{ width: '20%', textAlign: 'center' }}>Free</span>
              </div>
            </>
          );
        })()}
      </div>

      {/* Total Registrations */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Total Registrations</h3>

        {participants.length > 0 ? (() => {
          const total = participants.length;
          const checkedIn = participants.filter(p => p.checkedIn).length;
          const checkedInPct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

          return (
            <>
              {event?.generateQRCode && (
                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem', background: '#fbcfe8' }}>
                  <div style={{ width: `${checkedInPct}%`, background: '#22c55e' }} title={`Checked In: ${checkedInPct}%`} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', fontWeight: 700, flexWrap: 'wrap' }}>
                {event?.generateQRCode && (
                  <span style={{ color: '#22c55e' }}>• {checkedIn} Checked In</span>
                )}
                <span style={{ color: '#ec4899' }}>• {total} Total Registrations</span>
              </div>
            </>
          );
        })() : (
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>No registrations yet.</div>
        )}
      </div>

      {/* Participants Details */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Participants Details</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #eaeaea', padding: '12px', borderRadius: '8px' }}>
            <Search size={18} color="#888" style={{ marginRight: '12px' }} />
            <input
              placeholder="Search participants by name, email, phone, ticket, status, custom answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', width: '100%' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', padding: '4px' }}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? '#111' : '#fff', color: viewMode === 'list' ? '#fff' : '#111', border: '1px solid #eaeaea', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <LayoutGrid size={14} /> All Participants
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setViewMode('detailed')} style={{ background: viewMode === 'detailed' ? '#111' : '#fff', color: viewMode === 'detailed' ? '#fff' : '#111', border: '1px solid #eaeaea', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <LayoutGrid size={14} /> View Data
              </button>
              <button onClick={handleDownloadData} style={{ background: '#fff', border: '1px solid #eaeaea', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Download size={14} /> Download Data
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {loading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Loading participants...</div>
            ) : participants.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No participants registered yet.</div>
            ) : filteredParticipants.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666', background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                No participants found matching "{searchTerm}".
              </div>
            ) : viewMode === 'list' ? (
              filteredParticipants.map((p, i) => {
                const customAnswers = (p.answers || []).map((a: any) => {
                  let ansStr = a.answer || '';
                  if (Array.isArray(ansStr)) ansStr = ansStr.join(', ');
                  return ansStr.toString();
                }).filter(Boolean);
                
                const dn = p.name || customAnswers[0] || 'N/A';
                const de = p.email || (p.name ? '' : customAnswers[1]) || '';
                const dp = p.phone || (p.name ? '' : customAnswers[2]) || '';
                
                return (
                <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '12px 1rem', borderRadius: '8px', border: '1px solid #eaeaea', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                    <UserAvatar name={p.name} avatar={p.avatar} size={36} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name || 'Participant'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', minWidth: '150px' }}>{p.email || '-'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{p.phone || '-'}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#22c55e' }}>{p.status}</span>
                    {event?.generateQRCode && p.checkedIn && (
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>
                        Checked In
                      </span>
                    )}
                    <button onClick={async () => {
                      if (window.confirm('Are you sure you want to deregister this participant?')) {
                        try {
                          await api.delete(`/events/${event._id || event.id}/participants/${p.id}`);
                          alert('Participant deregistered successfully!');
                          window.location.reload();
                        } catch (err) { alert('Failed to deregister'); }
                      }
                    }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }} title="Deregister">
                      Deregister
                    </button>
                  </div>
                </div>
              )})
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredParticipants.map((p, i) => {
                  const customAnswers = (p.answers || []).map((a: any) => {
                    let ansStr = a.answer || '';
                    if (Array.isArray(ansStr)) ansStr = ansStr.join(', ');
                    return ansStr.toString();
                  }).filter(Boolean);
                  
                  const dn = p.name || customAnswers[0] || 'N/A';
                  const de = p.email || (p.name ? '' : customAnswers[1]) || '';
                  const dp = p.phone || (p.name ? '' : customAnswers[2]) || '';
                  
                  return (
                  <div key={p.id || i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserAvatar name={p.name} avatar={p.avatar} size={48} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: '6px' }}>{p.name || 'Participant'} {p.isTeam && <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px' }}>👑 Leader</span>}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{p.email || '-'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.phone || '-'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ background: '#f3e8ff', color: '#9333ea', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {p.type} Pass
                        </span>
                        <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px dashed #eaeaea', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#111', fontWeight: 800 }}>Registration Data</h5>
                      {p.answers && p.answers.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                          {p.answers.map((ans: any, idx: number) => {
                            const isLink = ans.answer && typeof ans.answer === 'string' && (ans.answer.startsWith('http') || ans.answer.startsWith('blob:'));
                            const formattedAns = (() => {
                              if (!ans.answer) return null;
                              if (Array.isArray(ans.answer)) {
                                return Array.from(new Set(ans.answer)).filter(Boolean).join(', ');
                              }
                              if (typeof ans.answer === 'string' && ans.answer.includes('|||')) {
                                return Array.from(new Set(ans.answer.split('|||'))).filter(Boolean).join(', ');
                              }
                              return String(ans.answer);
                            })();

                            return (
                              <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{ans.question}</div>
                                {isLink ? (
                                  <a href={ans.answer} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                    <Download size={14} /> View File
                                  </a>
                                ) : (
                                  <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, wordBreak: 'break-word' }}>
                                    {formattedAns || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>N/A</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
                          No extra registration data provided.
                        </div>
                      )}

                      {p.isTeam && p.teamMembers && p.teamMembers.length > 1 && (
                        <div style={{ marginTop: '1.5rem', borderTop: '2px dashed #eaeaea', paddingTop: '1rem' }}>
                          <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#111', fontWeight: 800 }}>Other Team Members</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {p.teamMembers.slice(1).map((m: any, mIdx: number) => (
                              <div key={mIdx} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{m.name}</span>
                                  <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>Member {mIdx + 2}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#475569', margin: '4px 0 10px 0', fontWeight: 600 }}>{m.email} {m.phone ? `• ${m.phone}` : ''}</div>

                                {m.customAnswers && m.customAnswers.length > 0 && (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                                    {m.customAnswers.map((ans: any, aIdx: number) => {
                                      const isLink = ans.answer && typeof ans.answer === 'string' && (ans.answer.startsWith('http') || ans.answer.startsWith('blob:'));
                                      const formattedAns = (() => {
                                        if (!ans.answer) return null;
                                        if (Array.isArray(ans.answer)) {
                                          return Array.from(new Set(ans.answer)).filter(Boolean).join(', ');
                                        }
                                        if (typeof ans.answer === 'string' && ans.answer.includes('|||')) {
                                          return Array.from(new Set(ans.answer.split('|||'))).filter(Boolean).join(', ');
                                        }
                                        return String(ans.answer);
                                      })();

                                      return (
                                        <div key={aIdx} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>{ans.question}</span>
                                          {isLink ? (
                                            <a href={ans.answer} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>View File</a>
                                          ) : (
                                            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>{formattedAns || 'N/A'}</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
                      <button onClick={async () => {
                        if (window.confirm('Are you sure you want to deregister this participant?')) {
                          try {
                            await api.delete(`/events/${event._id || event.id}/participants/${p.id}`);
                            alert('Participant deregistered successfully!');
                            window.location.reload();
                          } catch (err: any) { alert(`Failed to deregister: ${err.response?.data?.message || err.message}`); }
                        }
                      }} style={{ flex: 1, background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        Deregister
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
      {showCheckedInModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Checked In Participants</h3>
              <button onClick={() => setShowCheckedInModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={20} color="#666" />
              </button>
            </div>

            {participants.filter(p => p.checkedIn).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontWeight: 500 }}>No one has checked in yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {participants.filter(p => p.checkedIn).map((p, i) => (
                  <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 1rem', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #ccc' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.email}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>Checked In</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// ANNOUNCEMENT TAB
// -------------------------------------------------------------
function AnnouncementTab({ event, saveEvent }: { event: any, saveEvent: any }) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>(event?.announcements || []);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const handleSend = async () => {
    if (!newAnnouncement.trim()) return;
    const updated = [...announcements, { title: 'Announcement', content: newAnnouncement, date: new Date() }];
    const success = await saveEvent({ announcements: updated });
    if (success) {
      setAnnouncements(updated);
      setNewAnnouncement('');
    }
  };

  const handleDelete = async (indexToDelete: number) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      const updated = announcements.filter((_, idx) => idx !== indexToDelete);
      const success = await saveEvent({ announcements: updated });
      if (success) {
        setAnnouncements(updated);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#111' }}>Announcement</h3>
        <div style={{ background: '#fff', border: '1px solid #eaeaea', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <img src={user?.avatar || darkLogo} alt="Club Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            <textarea value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} placeholder="Send an Announcement..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', minHeight: '80px', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#eaeaea', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Recipient <span style={{ color: '#888' }}>All</span> <ChevronDown size={14} />
              </div>
              <div style={{ background: '#eaeaea', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#555' }}>
                Schedule
              </div>
            </div>
            <button onClick={handleSend} style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#111' }}>Announcement History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.length === 0 ? (
            <div style={{ color: '#888', fontSize: '0.9rem' }}>No announcements yet.</div>
          ) : announcements.map((ann, idx) => (
            <div key={idx} style={{ background: '#fff', border: '1px solid #eaeaea', padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
              <img src={user?.avatar || darkLogo} alt="Club Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111', marginBottom: '0.5rem', textAlign: 'left' }}>
                    {ann.title || 'Announcement'} <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'normal', marginLeft: '8px' }}>{new Date(ann.date).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem', whiteSpace: 'pre-wrap', textAlign: 'left' }}>{ann.content}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'left' }}>Sent to All Participants</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SETTINGS TAB
// -------------------------------------------------------------
function SettingsTab({ event, saveEvent }: { event: any, saveEvent: any }) {
  const [visibility, setVisibility] = useState(event?.visibility || 'Public');
  const [generateQRCode, setGenerateQRCode] = useState(event?.generateQRCode || false);
  const [] = useState(event?.registrationControl || 'Require Approval');

  const [teamMembers, setTeamMembers] = useState<any[]>(event?.organizingTeam?.length > 0 ? event.organizingTeam : []);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', role: 'Coordinator' });

  const handleCancelEvent = async () => {
    if (window.confirm('Are you sure you want to cancel this event? This action cannot be undone.')) {
      try {
        await api.delete(`/events/submission/${event._id || event.id}`);
        alert('Event Cancelled Successfully');
        window.location.hash = '#organizer-dashboard/my-events';
      } catch (err: any) {
        console.error(err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel event.';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const getRoleColor = (role: string) => {
    if (role === 'Admin') return '#ec4899';
    if (role === 'Coordinator') return '#3b82f6';
    return '#a855f7';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Visibility */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#111' }}>Visibility</h3>
        </div>
        <div style={{ border: '1px solid #eaeaea', padding: '12px 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>Visibility</span>
          <select value={visibility} onChange={async e => {
            setVisibility(e.target.value);
            await saveEvent({ visibility: e.target.value });
          }} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: '#888', cursor: 'pointer' }}>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="Unlisted">Unlisted</option>
          </select>
        </div>
      </div>

      {/* QR Code Generation */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#111' }}>QR Code Ticketing</h3>
        </div>
        <div style={{ border: '1px solid #eaeaea', padding: '12px 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>Generate QR Code for Attendees</span>
          <div
            onClick={async () => {
              const newVal = !generateQRCode;
              setGenerateQRCode(newVal);
              await saveEvent({ generateQRCode: newVal });
            }}
            style={{ width: '40px', height: '24px', background: generateQRCode ? '#8B5CF6' : '#ccc', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
          >
            <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: generateQRCode ? '19px' : '3px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#111' }}>Team Management</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Invite your organizing team</p>
          </div>
          <button onClick={() => setIsAddingMember(!isAddingMember)} style={{ background: '#eaeaea', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Plus size={14} /> Add Team Member</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {teamMembers.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '12px 1rem', borderRadius: '8px', border: '1px solid #eaeaea', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '150px' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #ccc' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', minWidth: '150px' }}>{m.email}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>{m.phone}</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: m.color }}>{m.role}</span>
                <button onClick={async () => {
                  const updated = teamMembers.filter(t => t.id !== m.id);
                  setTeamMembers(updated);
                  await saveEvent({ organizingTeam: updated });
                }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}

          {isAddingMember && (
            <div style={{ background: '#fff', border: '1px dashed #ccc', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Name" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="email" placeholder="Email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Phone" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <select value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="Admin">Admin</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Volunteer">Volunteer</option>
              </select>
              <button onClick={async () => {
                if (newMember.name) {
                  const updated = [...teamMembers, { id: Date.now(), ...newMember, color: getRoleColor(newMember.role) }];
                  const success = await saveEvent({ organizingTeam: updated });
                  if (success) {
                    setTeamMembers(updated);
                    setNewMember({ name: '', email: '', phone: '', role: 'Coordinator' });
                    setIsAddingMember(false);
                  }
                }
              }} style={{ background: '#111', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Invite</button>
            </div>
          )}
        </div>
      </div>



      {/* Cancel Event */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#111' }}>Cancel Event</h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#666' }}>Delete this event permanently. All the registered participants will be informed.</p>
        <button onClick={handleCancelEvent} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Trash2 size={16} /> Cancel Event
        </button>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// MAIN EXPORT
// -------------------------------------------------------------
export default function ManageEvent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'registration' | 'participants' | 'announcement' | 'settings'>('overview');
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/organizer/notifications`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, []);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const hash = window.location.hash;
        let id = '';
        if (hash.includes('?id=')) {
          id = hash.split('?id=')[1];
        } else if (hash.includes('=')) {
          id = hash.split('=')[1];
        }
        if (!id) throw new Error('No event ID provided');

        const { data } = await api.get(`/events/${id}`);
        setEventData(data);
        setEditedTitle(data.title);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, []);

  const saveEvent = async (updates: any) => {
    try {
      try {
        const res = await api.put(`/events/submission/${eventData._id || eventData.id}`, updates);
        const updated = res.data?.submission || res.data;
        setEventData((prev: any) => ({ ...prev, ...updated }));
        return true;
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          const res = await api.put(`/admin/events/${eventData._id || eventData.id}`, updates);
          const updated = res.data?.submission || res.data;
          setEventData((prev: any) => ({ ...prev, ...updated }));
          return true;
        }
        throw err;
      }
    } catch (err: any) {
      console.error('Failed to save', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Failed to save changes: ${errorMessage}`);
      return false;
    }
  };

  const navigateTo = (tab: 'events' | 'create') => {
    window.location.hash = tab === 'events' ? '#organizer-dashboard/my-events' : '#organizer-dashboard/create-event';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        input, textarea, select { font-family: 'Inter', sans-serif !important; }
        ::placeholder { font-family: 'Inter', sans-serif !important; opacity: 0.6; }
        .tab-btn {
          background: none; border: none; cursor: pointer; padding: 0.5rem 1rem;
          font-weight: 600; font-size: 0.95rem; color: #888; transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .tab-btn.active { color: #111; border-bottom: 2px solid #111; font-weight: 700; }
        .card-container {
          background: #fff; border-radius: 12px; padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #eaeaea;
          margin-bottom: 1.5rem;
        }
        .card-header {
          display: flex; justify-content: space-between; alignItems: center; margin-bottom: 1.5rem;
        }
        .card-title { font-size: 1.1rem; font-weight: 800; color: #111; margin: 0; }
        .add-btn {
          background: #eaeaea; border: none; padding: 8px 12px; border-radius: 8px;
          font-size: 0.8rem; font-weight: 700; color: #555; cursor: pointer;
          display: flex; alignItems: center; gap: 4px;
        }

        @media (max-width: 768px) {
          .mobile-main { padding: 6rem 1.25rem 3rem 1.25rem !important; }
          .mobile-nav-hide { display: none !important; }
          .mobile-nav-show { display: flex !important; }
          
          /* Overview Grid columns */
          .mobile-grid-2col { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .mobile-form-row { flex-direction: column !important; gap: 0.5rem !important; align-items: flex-start !important; }
          .mobile-form-col { width: 100% !important; }
          
          /* Table horizontal scroll wrapper */
          .mobile-table-scroll { display: block !important; width: 100% !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          
          /* Header Title responsiveness */
          h1 { font-size: 1.8rem !important; }
          
          /* Settings organizing team cards grid */
          .mobile-team-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Background Gradient overlay for Navbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '180px',
        zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(233,213,255,0.7) 0%, rgba(233,213,255,0) 100%)',
      }} />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 101, background: 'transparent'
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.location.hash = '#home'}>
          <img src={darkLogo} alt="Eventum" style={{ height: '28px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111' }}>Eventum<span style={{ color: '#ec4899' }}>.</span></span>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        {user?.role !== 'admin' && (
          <>
            <div className="mobile-nav-hide" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
              <button onClick={() => navigateTo('events')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>
                <LayoutGrid size={18} /> My Events
              </button>
              <button onClick={() => navigateTo('create')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: 'rgba(0,0,0,0.5)' }}>
                <Plus size={18} /> Create Event
              </button>
            </div>

            {/* Right: Icons (Desktop) */}
            <div className="mobile-nav-hide" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button
                onClick={() => {
                  sessionStorage.setItem('triggerSearch', 'true');
                  window.location.hash = '#organizer-dashboard/my-events';
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex' }}
              >
                <Search size={20} />
              </button>

              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsNotificationsOpen(true)}
                onMouseLeave={() => setIsNotificationsOpen(false)}
              >
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: isNotificationsOpen ? '#ec4899' : '#111', display: 'flex', position: 'relative' }}>
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute', top: '120%', right: 0,
                        background: '#fff',
                        borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.06)', padding: '1rem',
                        minWidth: '280px', zIndex: 2000,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111', marginBottom: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem', textAlign: 'left' }}>
                        Notifications
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', padding: '1rem 0' }}>No new notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n._id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem', textAlign: 'left', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <div style={{ color: '#111', fontWeight: 700 }}>{n.title}</div>
                              <div style={{ color: '#555', marginTop: '2px' }}>{n.message}</div>
                              <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)' }}>
                <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Organizer"} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>

            {/* Hamburger Icon (Mobile Only) */}
            <div className="mobile-nav-show" style={{ display: 'none', alignItems: 'center' }}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex' }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-show" style={{
          display: 'none', flexDirection: 'column', position: 'fixed', top: '64px', left: 0, width: '100%',
          background: '#fff', borderBottom: '1px solid #eaeaea', boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
          padding: '1.5rem', zIndex: 100, gap: '1.5rem'
        }}>
          {/* Profile Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eaeaea' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#111', overflow: 'hidden' }}>
              <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Organizer"} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#111' }}>{user?.name || 'Organizer'}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{user?.email || 'organizer@eventum.com'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button style={{ background: 'none', border: 'none', textAlign: 'left', fontWeight: 600, padding: '0.5rem 0', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => { setIsMobileMenuOpen(false); window.location.hash = '#organizer-setup'; }}>
              <User size={18} /> Edit Profile
            </button>
            <button style={{ background: 'none', border: 'none', textAlign: 'left', fontWeight: 600, padding: '0.5rem 0', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => { setIsMobileMenuOpen(false); window.location.hash = '#home'; }}>
              <User size={18} /> User Dashboard
            </button>
          </div>

          {/* Nav Links */}
          <button
            onClick={() => { navigateTo('events'); setIsMobileMenuOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', color: '#111' }}
          >
            <LayoutGrid size={20} /> My Events
          </button>

          <button
            onClick={() => { navigateTo('create'); setIsMobileMenuOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', color: '#111' }}
          >
            <Plus size={20} /> Create Event
          </button>

          {/* Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
            <button
              onClick={() => {
                sessionStorage.setItem('triggerSearch', 'true');
                window.location.hash = '#organizer-dashboard/my-events';
                setIsMobileMenuOpen(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#555' }}
            >
              <Search size={20} /> Search
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="mobile-main" style={{ flex: 1, padding: '6rem 2rem 3rem 2rem', maxWidth: '1000px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>

        {/* Header & Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          {isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                autoFocus
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const success = await saveEvent({ title: editedTitle });
                    if (success) setIsEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setEditedTitle(eventData?.title || '');
                  }
                }}
                onBlur={() => {
                  setIsEditingTitle(false);
                  setEditedTitle(eventData?.title || '');
                }}
                style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, padding: '0 8px', border: '2px solid #7c3aed', borderRadius: '8px', outline: 'none', background: '#fff', color: '#111' }}
              />
              <button onClick={async () => {
                const success = await saveEvent({ title: editedTitle });
                if (success) setIsEditingTitle(false);
              }} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}>Save</button>
            </div>
          ) : (
            <h1 onClick={() => setIsEditingTitle(true)} style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, cursor: 'pointer' }} title="Click to edit">
              {eventData?.title || 'Event Name'}<span style={{ color: '#ec4899' }}>.</span>
            </h1>
          )}

        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eaeaea', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {['overview', 'registration', 'participants', 'announcement', 'settings'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab as any)}
              style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>
        ) : eventData ? (
          <>
            {activeTab === 'overview' && <OverviewTab event={eventData} saveEvent={saveEvent} />}
            {activeTab === 'registration' && <RegistrationTab event={eventData} saveEvent={saveEvent} />}
            {activeTab === 'participants' && <ParticipantsTab event={eventData} />}
            {activeTab === 'announcement' && <AnnouncementTab event={eventData} saveEvent={saveEvent} />}
            {activeTab === 'settings' && <SettingsTab event={eventData} saveEvent={saveEvent} />}
          </>
        ) : null}

      </main>

      <Footer />
    </div>
  );
}
