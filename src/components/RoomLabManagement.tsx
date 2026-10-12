import React, { useState } from 'react';
import {
  DoorOpen,
  Cpu,
  Plus,
  Building,
  Tv,
  Wind,
  CheckCircle,
  Layers,
  X,
  Zap,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  Wrench,
  Lock,
  Unlock,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Edit3,
  Trash2,
  ExternalLink,
  Info,
  Server,
  Monitor,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  Room,
  Lab,
  Department,
  RoomFacilityType,
  UserRole,
  LabType,
  ResourceSlotType,
  RoomAvailability,
  LabAvailability,
  AcademicDay,
  TimetableSlot
} from '../types/database';
import {
  roomSchema,
  editRoomSchema,
  labSchema,
  editLabSchema,
  resourceAvailabilitySchema
} from '../lib/validations';

interface RoomLabManagementProps {
  rooms: Room[];
  labs: Lab[];
  departments: Department[];
  roomAvailabilities?: RoomAvailability[];
  labAvailabilities?: LabAvailability[];
  timetableSlots?: TimetableSlot[];
  onAddRoom: (room: Omit<Room, 'id' | 'created_at'>) => void;
  onUpdateRoom?: (id: string, updated: Partial<Room>) => void;
  onDeleteRoom?: (id: string) => void;
  onAddLab: (lab: Omit<Lab, 'id' | 'created_at'>) => void;
  onUpdateLab?: (id: string, updated: Partial<Lab>) => void;
  onDeleteLab?: (id: string) => void;
  onAddRoomAvailability?: (rule: Omit<RoomAvailability, 'id' | 'created_at'>) => void;
  onRemoveRoomAvailability?: (id: string) => void;
  onAddLabAvailability?: (rule: Omit<LabAvailability, 'id' | 'created_at'>) => void;
  onRemoveLabAvailability?: (id: string) => void;
  currentRole: UserRole;
  userAssignedDeptId?: string;
  initialTab?: 'rooms' | 'labs';
}

type ResourceTab = 'rooms' | 'labs' | 'availability' | 'analytics';

export const RoomLabManagement: React.FC<RoomLabManagementProps> = ({
  rooms,
  labs,
  departments,
  roomAvailabilities = [],
  labAvailabilities = [],
  timetableSlots = [],
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onAddLab,
  onUpdateLab,
  onDeleteLab,
  onAddRoomAvailability,
  onRemoveRoomAvailability,
  onAddLabAvailability,
  onRemoveLabAvailability,
  currentRole,
  userAssignedDeptId,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<ResourceTab>(initialTab || 'rooms');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>(
    currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : 'ALL'
  );
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected for slide-over drawer
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  // Modals
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
  const [isEditLabModalOpen, setIsEditLabModalOpen] = useState(false);
  const [isAvailabilityRuleModalOpen, setIsAvailabilityRuleModalOpen] = useState(false);

  // Feedback State
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Room Form State
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomBuilding, setRoomBuilding] = useState('Alan Turing Academic Complex');
  const [roomFloor, setRoomFloor] = useState(1);
  const [roomCapacity, setRoomCapacity] = useState(70);
  const [roomType, setRoomType] = useState<RoomFacilityType>('SMART_CLASSROOM');
  const [roomHasProjector, setRoomHasProjector] = useState(true);
  const [roomHasAC, setRoomHasAC] = useState(true);
  const [roomIsShared, setRoomIsShared] = useState(true);
  const [roomDeptId, setRoomDeptId] = useState(
    currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : departments[0]?.id || ''
  );
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // Lab Form State
  const [labName, setLabName] = useState('');
  const [labCode, setLabCode] = useState('');
  const [labBuilding, setLabBuilding] = useState('Ada Lovelace Tech Center');
  const [labFloor, setLabFloor] = useState(2);
  const [labPCCount, setLabPCCount] = useState(40);
  const [labCapacity, setLabCapacity] = useState(40);
  const [labType, setLabType] = useState<LabType>('COMPUTER_SCIENCE');
  const [labHardware, setLabHardware] = useState('');
  const [labHasUPS, setLabHasUPS] = useState(true);
  const [labIsShared, setLabIsShared] = useState(true);
  const [labDeptId, setLabDeptId] = useState(
    currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : departments[0]?.id || ''
  );
  const [labToEdit, setLabToEdit] = useState<Lab | null>(null);

  // Availability / Maintenance Form State
  const [availResourceType, setAvailResourceType] = useState<'ROOM' | 'LAB'>('ROOM');
  const [availResourceId, setAvailResourceId] = useState<string>(rooms[0]?.id || '');
  const [availDay, setAvailDay] = useState<AcademicDay>('SATURDAY');
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('12:00');
  const [availSlotType, setAvailSlotType] = useState<ResourceSlotType>('MAINTENANCE');
  const [availReason, setAvailReason] = useState('Weekly Hardware & Software Diagnostic Routine');

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    if (currentRole === 'ADMIN' && userAssignedDeptId) {
      if (r.owning_department_id && r.owning_department_id !== userAssignedDeptId && !r.is_shared_across_departments) {
        return false;
      }
    }
    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      r.owning_department_id === selectedDeptFilter ||
      r.department_id === selectedDeptFilter ||
      (selectedDeptFilter === 'SHARED' && r.is_shared_across_departments);

    const matchesBuilding = selectedBuildingFilter === 'ALL' || r.building === selectedBuildingFilter;
    const matchesSearch =
      !searchQuery ||
      r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.room_name && r.room_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.building.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesBuilding && matchesSearch;
  });

  // Filter Labs
  const filteredLabs = labs.filter((l) => {
    if (currentRole === 'ADMIN' && userAssignedDeptId) {
      if (l.owning_department_id && l.owning_department_id !== userAssignedDeptId && !l.is_shared) {
        return false;
      }
    }
    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      l.owning_department_id === selectedDeptFilter ||
      l.department_id === selectedDeptFilter;

    const matchesBuilding = selectedBuildingFilter === 'ALL' || l.building === selectedBuildingFilter;
    const matchesSearch =
      !searchQuery ||
      (l.lab_code && l.lab_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.lab_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.building.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesBuilding && matchesSearch;
  });

  // Unique Buildings
  const allBuildings = Array.from(new Set([...rooms.map((r) => r.building), ...labs.map((l) => l.building)]));

  // Active Detail Objects
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) || null : null;
  const activeLab = selectedLabId ? labs.find((l) => l.id === selectedLabId) || null : null;
  const activeRoomRules = activeRoom ? roomAvailabilities.filter((ra) => ra.room_id === activeRoom.id) : [];
  const activeLabRules = activeLab ? labAvailabilities.filter((la) => la.lab_id === activeLab.id) : [];

  // Analytics Computations
  const totalRoomSeats = rooms.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalLabWorkstations = labs.reduce((acc, curr) => acc + curr.pc_count, 0);
  const sharedRoomsCount = rooms.filter((r) => r.is_shared_across_departments).length;
  const sharedLabsCount = labs.filter((l) => l.is_shared).length;
  const maintenanceBlocksCount = roomAvailabilities.length + labAvailabilities.length;

  // Handlers: Room Creation
  const handleOpenCreateRoom = () => {
    setFormError(null);
    setRoomName('');
    setRoomNumber('');
    setRoomBuilding(allBuildings[0] || 'Alan Turing Complex');
    setRoomFloor(1);
    setRoomCapacity(70);
    setRoomType('SMART_CLASSROOM');
    setRoomHasProjector(true);
    setRoomHasAC(true);
    setRoomIsShared(true);
    setRoomDeptId(currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : departments[0]?.id || '');
    setIsAddRoomModalOpen(true);
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = roomSchema.safeParse({
      room_name: roomName.trim(),
      room_number: roomNumber.toUpperCase().trim(),
      building: roomBuilding.trim(),
      floor: Number(roomFloor),
      capacity: Number(roomCapacity),
      facility_type: roomType,
      department_id: roomDeptId || '',
      has_projector: roomHasProjector,
      has_air_conditioning: roomHasAC,
      is_shared_across_departments: roomIsShared,
      is_active: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    // Check duplicate room number in building
    const isDuplicate = rooms.some(
      (r) =>
        r.building.toLowerCase() === roomBuilding.toLowerCase().trim() &&
        r.room_number.toUpperCase() === roomNumber.toUpperCase().trim()
    );
    if (isDuplicate) {
      setFormError(`Room ${roomNumber.toUpperCase()} already exists in ${roomBuilding}.`);
      return;
    }

    onAddRoom({
      institute_id: 'inst-001',
      room_name: roomName.trim(),
      room_number: roomNumber.toUpperCase().trim(),
      building: roomBuilding.trim(),
      floor: Number(roomFloor),
      capacity: Number(roomCapacity),
      facility_type: roomType,
      has_projector: roomHasProjector,
      has_air_conditioning: roomHasAC,
      is_shared_across_departments: roomIsShared,
      owning_department_id: roomDeptId || undefined,
      department_id: roomDeptId || undefined,
      is_active: true,
    });

    setIsAddRoomModalOpen(false);
  };

  const handleOpenEditRoom = (room: Room) => {
    setFormError(null);
    setRoomToEdit(room);
    setRoomName(room.room_name || room.room_number);
    setRoomNumber(room.room_number);
    setRoomBuilding(room.building);
    setRoomFloor(room.floor);
    setRoomCapacity(room.capacity);
    setRoomType(room.facility_type);
    setRoomHasProjector(room.has_projector);
    setRoomHasAC(room.has_air_conditioning);
    setRoomIsShared(room.is_shared_across_departments);
    setRoomDeptId(room.owning_department_id || room.department_id || '');
    setIsEditRoomModalOpen(true);
  };

  const handleUpdateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToEdit || !onUpdateRoom) return;

    onUpdateRoom(roomToEdit.id, {
      room_name: roomName.trim(),
      building: roomBuilding.trim(),
      floor: Number(roomFloor),
      capacity: Number(roomCapacity),
      facility_type: roomType,
      has_projector: roomHasProjector,
      has_air_conditioning: roomHasAC,
      is_shared_across_departments: roomIsShared,
      owning_department_id: roomDeptId || undefined,
      department_id: roomDeptId || undefined,
    });

    setIsEditRoomModalOpen(false);
  };

  // Handlers: Lab Creation
  const handleOpenCreateLab = () => {
    setFormError(null);
    setLabName('');
    setLabCode('');
    setLabBuilding(allBuildings[0] || 'Ada Lovelace Tech Center');
    setLabFloor(2);
    setLabPCCount(40);
    setLabCapacity(40);
    setLabType('COMPUTER_SCIENCE');
    setLabHardware('High performance workstations with GPU acceleration');
    setLabHasUPS(true);
    setLabIsShared(true);
    setLabDeptId(currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : departments[0]?.id || '');
    setIsAddLabModalOpen(true);
  };

  const handleCreateLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = labCode.toUpperCase().trim();
    const validation = labSchema.safeParse({
      name: labName.trim(),
      lab_code: code,
      building: labBuilding.trim(),
      floor: Number(labFloor),
      capacity: Number(labCapacity),
      pc_count: Number(labPCCount),
      lab_type: labType,
      department_id: labDeptId || '',
      specialized_hardware: labHardware.trim(),
      has_ups_backup: labHasUPS,
      is_shared: labIsShared,
      is_active: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    // Check duplicate code
    const isDuplicate = labs.some((l) => (l.lab_code || l.lab_number).toUpperCase() === code);
    if (isDuplicate) {
      setFormError(`Lab code ${code} already exists.`);
      return;
    }

    onAddLab({
      institute_id: 'inst-001',
      name: labName.trim(),
      lab_number: code,
      lab_code: code,
      building: labBuilding.trim(),
      floor: Number(labFloor),
      capacity: Number(labCapacity),
      pc_count: Number(labPCCount),
      lab_type: labType,
      specialized_hardware: labHardware.trim(),
      has_ups_backup: labHasUPS,
      is_shared: labIsShared,
      owning_department_id: labDeptId || undefined,
      department_id: labDeptId || undefined,
      is_active: true,
    });

    setIsAddLabModalOpen(false);
  };

  const handleOpenEditLab = (lab: Lab) => {
    setFormError(null);
    setLabToEdit(lab);
    setLabName(lab.name);
    setLabCode(lab.lab_code || lab.lab_number);
    setLabBuilding(lab.building);
    setLabFloor(lab.floor);
    setLabCapacity(lab.capacity);
    setLabPCCount(lab.pc_count);
    setLabType(lab.lab_type || 'COMPUTER_SCIENCE');
    setLabHardware(lab.specialized_hardware || '');
    setLabHasUPS(lab.has_ups_backup);
    setLabIsShared(lab.is_shared);
    setLabDeptId(lab.owning_department_id || lab.department_id || '');
    setIsEditLabModalOpen(true);
  };

  const handleUpdateLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labToEdit || !onUpdateLab) return;

    onUpdateLab(labToEdit.id, {
      name: labName.trim(),
      building: labBuilding.trim(),
      floor: Number(labFloor),
      capacity: Number(labCapacity),
      pc_count: Number(labPCCount),
      lab_type: labType,
      specialized_hardware: labHardware.trim(),
      has_ups_backup: labHasUPS,
      is_shared: labIsShared,
      owning_department_id: labDeptId || undefined,
      department_id: labDeptId || undefined,
    });

    setIsEditLabModalOpen(false);
  };

  // Handlers: Availability Rule Submission
  const handleCreateAvailabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (availResourceType === 'ROOM' && onAddRoomAvailability) {
      onAddRoomAvailability({
        institute_id: 'inst-001',
        room_id: availResourceId,
        day_of_week: availDay,
        start_time: availStart,
        end_time: availEnd,
        slot_type: availSlotType,
        reason: availReason.trim(),
        is_recurring: true,
      });
    } else if (availResourceType === 'LAB' && onAddLabAvailability) {
      onAddLabAvailability({
        institute_id: 'inst-001',
        lab_id: availResourceId,
        day_of_week: availDay,
        start_time: availStart,
        end_time: availEnd,
        slot_type: availSlotType,
        reason: availReason.trim(),
        is_recurring: true,
      });
    }

    setIsAvailabilityRuleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <DoorOpen className="h-6 w-6 text-indigo-400" />
              <span>Campus Resource Management</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Rooms & Labs
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Manage physical lecture theatres, smart classrooms, specialized engineering labs, maintenance windows, and temporary locking rules.
          </p>
        </div>

        {/* Action Buttons based on Role */}
        {currentRole !== 'FACULTY' && (
          <div className="flex items-center gap-2">
            {activeTab === 'rooms' && (
              <button
                onClick={handleOpenCreateRoom}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Classroom</span>
              </button>
            )}

            {activeTab === 'labs' && (
              <button
                onClick={handleOpenCreateLab}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#4F46E5] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Laboratory</span>
              </button>
            )}

            <button
              onClick={() => {
                setFormError(null);
                setAvailResourceType('ROOM');
                setAvailResourceId(rooms[0]?.id || '');
                setIsAvailabilityRuleModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-zinc-800/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-all"
            >
              <Wrench className="h-4 w-4 text-amber-400" />
              <span>Lock / Maintenance</span>
            </button>
          </div>
        )}
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Classrooms</span>
            <DoorOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{rooms.length}</span>
            <span className="text-[11px] text-zinc-400">({totalRoomSeats} Seats)</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Specialized Labs</span>
            <Cpu className="h-4 w-4 text-[#06B6D4]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{labs.length}</span>
            <span className="text-[11px] text-zinc-400">({totalLabWorkstations} Workstations)</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Shared Capacity</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {sharedRoomsCount + sharedLabsCount}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Cross-Dept Shared</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Maintenance & Locks</span>
            <Lock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{maintenanceBlocksCount}</span>
            <span className="text-[11px] text-zinc-400">Active Rules</span>
          </div>
        </div>
      </div>

      {/* Main Resource Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <DoorOpen className="h-4 w-4" />
          <span>Classrooms & Lecture Halls ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'labs'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Laboratories & Studios ({labs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'availability'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Maintenance & Locks ({maintenanceBlocksCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Resource Analytics</span>
        </button>
      </div>

      {/* Filters Bar for Rooms & Labs */}
      {(activeTab === 'rooms' || activeTab === 'labs') && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/60 rounded-xl border border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder={activeTab === 'rooms' ? 'Search room name/number...' : 'Search lab name/code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-zinc-800/80 border border-white/[0.08] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
              />
            </div>

            {/* Department Filter */}
            {currentRole !== 'ADMIN' && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400">Dept:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-zinc-800 border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="SHARED">Campus Shared Only</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Building Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400">Building:</span>
              <select
                value={selectedBuildingFilter}
                onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                className="bg-zinc-800 border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Buildings</option>
                {allBuildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border text-xs ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 border-white/[0.2] text-white'
                  : 'border-transparent text-zinc-500 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg border text-xs ${
                viewMode === 'table'
                  ? 'bg-zinc-800 border-white/[0.2] text-white'
                  : 'border-transparent text-zinc-500 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAB: CLASSROOMS & LECTURE HALLS */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => {
                const dept = departments.find((d) => d.id === (room.owning_department_id || room.department_id));
                const rules = roomAvailabilities.filter((ra) => ra.room_id === room.id);
                const hasLock = rules.some((r) => r.slot_type === 'LOCKED' || r.slot_type === 'MAINTENANCE');

                return (
                  <div
                    key={room.id}
                    className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 hover:border-white/[0.15] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            {room.room_number}
                          </span>
                          {dept ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${dept.color_accent || '#4F46E5'}15`,
                                color: dept.color_accent || '#818CF8',
                                border: `1px solid ${dept.color_accent || '#4F46E5'}30`,
                              }}
                            >
                              {dept.code}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                              Shared
                            </span>
                          )}
                        </div>

                        {hasLock && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Locked Slots
                          </span>
                        )}
                      </div>

                      {/* Name & Building */}
                      <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {room.room_name || room.room_number}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-400 flex items-center gap-1">
                        <Building className="h-3 w-3 text-zinc-500" />
                        <span>
                          {room.building} • Floor {room.floor}
                        </span>
                      </p>

                      {/* Amenities & Capacity */}
                      <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-800/40 text-[11px] font-mono border border-white/[0.04]">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Capacity</span>
                          <span className="font-bold text-white text-sm">{room.capacity} Seats</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Type</span>
                          <span className="font-medium text-indigo-400">{room.facility_type.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {/* Amenities Pills */}
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                        {room.has_projector && (
                          <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded">
                            <Tv className="h-3 w-3 text-emerald-400" /> Projector
                          </span>
                        )}
                        {room.has_air_conditioning && (
                          <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded">
                            <Wind className="h-3 w-3 text-cyan-400" /> AC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedRoomId(room.id)}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>

                      {currentRole !== 'FACULTY' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditRoom(room)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Edit Classroom"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {onDeleteRoom && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete classroom ${room.room_number}?`)) {
                                  onDeleteRoom(room.id);
                                }
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Classroom"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3 px-4">Room Number / Name</th>
                      <th className="py-3 px-4">Building & Floor</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4">Facility Type</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Features</th>
                      {currentRole !== 'FACULTY' && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {filteredRooms.map((room) => {
                      const dept = departments.find((d) => d.id === (room.owning_department_id || room.department_id));
                      return (
                        <tr key={room.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-white">{room.room_number}</span>
                            <span className="block text-[11px] text-zinc-400">{room.room_name || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span>{room.building}</span>
                            <span className="block text-[10px] text-zinc-500 font-mono">Floor {room.floor}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-white">{room.capacity} seats</td>
                          <td className="py-3 px-4 font-mono text-indigo-400">{room.facility_type}</td>
                          <td className="py-3 px-4">{dept ? dept.code : 'Institute Shared'}</td>
                          <td className="py-3 px-4 text-[11px]">
                            {room.has_projector ? 'Projector' : ''}
                            {room.has_air_conditioning ? ', AC' : ''}
                          </td>
                          {currentRole !== 'FACULTY' && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenEditRoom(room)}
                                className="p-1 text-zinc-400 hover:text-white rounded"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: LABORATORIES & STUDIOS */}
      {/* ========================================================================= */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLabs.map((lab) => {
              const dept = departments.find((d) => d.id === (lab.owning_department_id || lab.department_id));
              const rules = labAvailabilities.filter((la) => la.lab_id === lab.id);
              const hasMaintenance = rules.some((r) => r.slot_type === 'MAINTENANCE');

              return (
                <div
                  key={lab.id}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 hover:border-white/[0.15] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                          {lab.lab_code || lab.lab_number}
                        </span>
                        {dept && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${dept.color_accent || '#4F46E5'}15`,
                              color: dept.color_accent || '#818CF8',
                              border: `1px solid ${dept.color_accent || '#4F46E5'}30`,
                            }}
                          >
                            {dept.code}
                          </span>
                        )}
                      </div>

                      {hasMaintenance && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Maintenance
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {lab.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400 flex items-center gap-1">
                      <Building className="h-3 w-3 text-zinc-500" />
                      <span>
                        {lab.building} • Floor {lab.floor}
                      </span>
                    </p>

                    {/* Specs Card */}
                    <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-800/40 text-[11px] font-mono border border-white/[0.04]">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Workstations</span>
                        <span className="font-bold text-white text-sm">{lab.pc_count} PCs</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Lab Type</span>
                        <span className="font-medium text-cyan-400 truncate block">
                          {(lab.lab_type || 'COMPUTER_SCIENCE').replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Hardware specs preview */}
                    {lab.specialized_hardware && (
                      <p className="mt-2.5 text-[11px] text-zinc-400 line-clamp-2 italic">
                        {lab.specialized_hardware}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedLabId(lab.id)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>

                    {currentRole !== 'FACULTY' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditLab(lab)}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Edit Lab"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {onDeleteLab && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete lab ${lab.lab_code || lab.lab_number}?`)) {
                                onDeleteLab(lab.id);
                              }
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Lab"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: AVAILABILITY RULES, MAINTENANCE & LOCKS */}
      {/* ========================================================================= */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Resource Allocation Rules & Maintenance Blocks</span>
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Define time slots where rooms or laboratories are locked for administrative events, server updates, or cleanrooms. The clash-free engine respects these blocks.
              </p>
            </div>

            {currentRole !== 'FACULTY' && (
              <button
                onClick={() => {
                  setFormError(null);
                  setIsAvailabilityRuleModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-xs font-semibold text-white shadow hover:opacity-95 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Lock / Maintenance Window</span>
              </button>
            )}
          </div>

          {/* List of rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Room Locks */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-indigo-400" />
                <span>Classroom Rules ({roomAvailabilities.length})</span>
              </h4>

              {roomAvailabilities.length > 0 ? (
                roomAvailabilities.map((rule) => {
                  const room = rooms.find((r) => r.id === rule.room_id);
                  return (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/60 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{room?.room_number}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {rule.slot_type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-300">{rule.reason || 'Restricted block'}</p>
                        <span className="mt-2 block text-[11px] font-mono text-zinc-500">
                          {rule.day_of_week} • {rule.start_time} to {rule.end_time}
                        </span>
                      </div>

                      {currentRole !== 'FACULTY' && onRemoveRoomAvailability && (
                        <button
                          onClick={() => onRemoveRoomAvailability(rule.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/[0.1] text-xs text-zinc-500 text-center">
                  No classroom maintenance blocks defined.
                </div>
              )}
            </div>

            {/* Lab Locks */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span>Laboratory Rules ({labAvailabilities.length})</span>
              </h4>

              {labAvailabilities.length > 0 ? (
                labAvailabilities.map((rule) => {
                  const lab = labs.find((l) => l.id === rule.lab_id);
                  return (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/60 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{lab?.lab_code || lab?.lab_number}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            {rule.slot_type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-300">{rule.reason || 'Lab maintenance block'}</p>
                        <span className="mt-2 block text-[11px] font-mono text-zinc-500">
                          {rule.day_of_week} • {rule.start_time} to {rule.end_time}
                        </span>
                      </div>

                      {currentRole !== 'FACULTY' && onRemoveLabAvailability && (
                        <button
                          onClick={() => onRemoveLabAvailability(rule.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/[0.1] text-xs text-zinc-500 text-center">
                  No laboratory maintenance blocks defined.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: RESOURCE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Distribution */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-400" />
                <span>Department Resource Allocation</span>
              </h3>
              <div className="space-y-2.5">
                {departments.map((dept) => {
                  const deptRooms = rooms.filter((r) => r.owning_department_id === dept.id || r.department_id === dept.id);
                  const deptLabs = labs.filter((l) => l.owning_department_id === dept.id || l.department_id === dept.id);

                  return (
                    <div key={dept.id} className="p-3 rounded-lg bg-zinc-800/40 border border-white/[0.04]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{dept.name}</span>
                        <span className="font-mono text-indigo-400">{deptRooms.length} Rooms • {deptLabs.length} Labs</span>
                      </div>
                      <div className="mt-2 w-full bg-zinc-700/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, ((deptRooms.length + deptLabs.length) / Math.max(1, rooms.length + labs.length)) * 100 * 2)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Capacity & Seating Statistics */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <span>Campus Seating Capacity Matrix</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-800/40 rounded-lg border border-white/[0.04]">
                  <span className="text-zinc-500 text-[10px] block uppercase font-mono">Total Classroom Seats</span>
                  <span className="text-xl font-bold text-white mt-1 block">{totalRoomSeats}</span>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Avg {Math.round(totalRoomSeats / Math.max(1, rooms.length))} seats/room</span>
                </div>
                <div className="p-3 bg-zinc-800/40 rounded-lg border border-white/[0.04]">
                  <span className="text-zinc-500 text-[10px] block uppercase font-mono">Workstation Terminals</span>
                  <span className="text-xl font-bold text-cyan-400 mt-1 block">{totalLabWorkstations}</span>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Avg {Math.round(totalLabWorkstations / Math.max(1, labs.length))} PCs/lab</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Timetable Generation Readiness</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Campus resource capacities exceed minimum class cohort sizes. Conflict avoidance algorithm will respect room capacities and maintenance locks during slot allocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: ROOM DETAILS */}
      {/* ========================================================================= */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F0F11] border-l border-white/[0.1] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {activeRoom.room_number}
                </span>
                <h2 className="mt-2 text-lg font-bold text-white">{activeRoom.room_name || activeRoom.room_number}</h2>
                <p className="text-xs text-zinc-400">
                  {activeRoom.building} • Floor {activeRoom.floor}
                </p>
              </div>
              <button
                onClick={() => setSelectedRoomId(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs">
              <div>
                <span className="text-zinc-500 text-[10px] block">Seating Capacity</span>
                <span className="text-base font-bold text-white">{activeRoom.capacity} Students</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Facility Class</span>
                <span className="text-base font-bold text-indigo-400">{activeRoom.facility_type}</span>
              </div>
            </div>

            {/* Rules list */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Scheduled Maintenance & Restrictions ({activeRoomRules.length})
              </span>
              {activeRoomRules.length > 0 ? (
                <div className="space-y-2">
                  {activeRoomRules.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400">{r.slot_type}</span>
                        <span className="font-mono text-zinc-400 text-[10px]">{r.day_of_week}</span>
                      </div>
                      <p className="mt-1 text-zinc-300">{r.reason}</p>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {r.start_time} - {r.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No maintenance blocks assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: LAB DETAILS */}
      {/* ========================================================================= */}
      {activeLab && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F0F11] border-l border-white/[0.1] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                  {activeLab.lab_code || activeLab.lab_number}
                </span>
                <h2 className="mt-2 text-lg font-bold text-white">{activeLab.name}</h2>
                <p className="text-xs text-zinc-400">
                  {activeLab.building} • Floor {activeLab.floor}
                </p>
              </div>
              <button
                onClick={() => setSelectedLabId(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs">
              <div>
                <span className="text-zinc-500 text-[10px] block">Workstations</span>
                <span className="text-base font-bold text-white">{activeLab.pc_count} Workstations</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Discipline</span>
                <span className="text-base font-bold text-cyan-400">{activeLab.lab_type || 'COMPUTER_SCIENCE'}</span>
              </div>
            </div>

            {activeLab.specialized_hardware && (
              <div className="p-3 bg-zinc-900 border border-white/[0.08] rounded-xl text-xs space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono block">Hardware Specification</span>
                <p className="text-zinc-200">{activeLab.specialized_hardware}</p>
              </div>
            )}

            {/* Rules list */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Maintenance Schedule ({activeLabRules.length})
              </span>
              {activeLabRules.length > 0 ? (
                <div className="space-y-2">
                  {activeLabRules.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cyan-400">{r.slot_type}</span>
                        <span className="font-mono text-zinc-400 text-[10px]">{r.day_of_week}</span>
                      </div>
                      <p className="mt-1 text-zinc-300">{r.reason}</p>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {r.start_time} - {r.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No maintenance blocks scheduled.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CLASSROOM */}
      {/* ========================================================================= */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-indigo-400" />
                <span>Create Campus Classroom</span>
              </h2>
              <button onClick={() => setIsAddRoomModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LH-101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Room Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turing Lecture Hall 1"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Building</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alan Turing Complex"
                    value={roomBuilding}
                    onChange={(e) => setRoomBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Facility Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomFacilityType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="SMART_CLASSROOM">Smart Classroom</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="SEMINAR_HALL">Seminar Hall</option>
                    <option value="AUDITORIUM">Auditorium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Department</label>
                  <select
                    value={roomDeptId}
                    onChange={(e) => setRoomDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="">Institute Shared</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomHasProjector}
                    onChange={(e) => setRoomHasProjector(e.target.checked)}
                    className="rounded bg-zinc-900 border-white/[0.1] text-indigo-600 focus:ring-0"
                  />
                  <span className="text-zinc-300">Projector / Screen</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomHasAC}
                    onChange={(e) => setRoomHasAC(e.target.checked)}
                    className="rounded bg-zinc-900 border-white/[0.1] text-indigo-600 focus:ring-0"
                  />
                  <span className="text-zinc-300">Air Conditioned</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomIsShared}
                    onChange={(e) => setRoomIsShared(e.target.checked)}
                    className="rounded bg-zinc-900 border-white/[0.1] text-indigo-600 focus:ring-0"
                  />
                  <span className="text-zinc-300">Shared Resource</span>
                </label>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CLASSROOM */}
      {/* ========================================================================= */}
      {isEditRoomModalOpen && roomToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <span>Edit Classroom {roomToEdit.room_number}</span>
              </h2>
              <button onClick={() => setIsEditRoomModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Room Display Name</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={roomBuilding}
                    onChange={(e) => setRoomBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Facility Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomFacilityType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="SMART_CLASSROOM">Smart Classroom</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="SEMINAR_HALL">Seminar Hall</option>
                    <option value="AUDITORIUM">Auditorium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Department</label>
                  <select
                    value={roomDeptId}
                    onChange={(e) => setRoomDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="">Institute Shared</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditRoomModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE LAB */}
      {/* ========================================================================= */}
      {isAddLabModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-400" />
                <span>Create Specialized Laboratory</span>
              </h2>
              <button onClick={() => setIsAddLabModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateLabSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Lab Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAB-AI-01"
                    value={labCode}
                    onChange={(e) => setLabCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Lab Category</label>
                  <select
                    value={labType}
                    onChange={(e) => setLabType(e.target.value as LabType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="COMPUTER_SCIENCE">Computer Science</option>
                    <option value="AI_DATA_SCIENCE">AI & Data Science</option>
                    <option value="HARDWARE_EMBEDDED">Hardware & Embedded Systems</option>
                    <option value="NETWORKING_SECURITY">Networking & Security</option>
                    <option value="ELECTRONICS_CIRCUITS">Electronics & Circuits</option>
                    <option value="GENERAL_PURPOSE">General Purpose Computing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Lab Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NVIDIA GPU Accelerated AI Laboratory"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={labBuilding}
                    onChange={(e) => setLabBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Workstations</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={labPCCount}
                    onChange={(e) => {
                      setLabPCCount(Number(e.target.value));
                      setLabCapacity(Number(e.target.value));
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Department</label>
                  <select
                    value={labDeptId}
                    onChange={(e) => setLabDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Specialized Hardware Specification</label>
                <input
                  type="text"
                  placeholder="e.g. 45x RTX 4090 24GB, Dual Xeon Platinum, 10Gbps Ethernet"
                  value={labHardware}
                  onChange={(e) => setLabHardware(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLabModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-white shadow-lg"
                >
                  Create Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE MAINTENANCE / LOCK WINDOW */}
      {/* ========================================================================= */}
      {isAvailabilityRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-400" />
                <span>Configure Maintenance Window / Lock</span>
              </h2>
              <button onClick={() => setIsAvailabilityRuleModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAvailabilitySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Resource Type</label>
                  <select
                    value={availResourceType}
                    onChange={(e) => {
                      const t = e.target.value as 'ROOM' | 'LAB';
                      setAvailResourceType(t);
                      setAvailResourceId(t === 'ROOM' ? rooms[0]?.id || '' : labs[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="ROOM">Classroom / Hall</option>
                    <option value="LAB">Laboratory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Lock Category</label>
                  <select
                    value={availSlotType}
                    onChange={(e) => setAvailSlotType(e.target.value as ResourceSlotType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="MAINTENANCE">Scheduled Maintenance</option>
                    <option value="LOCKED">Administrative Lock</option>
                    <option value="RESTRICTED">Research Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Select Target Resource</label>
                <select
                  value={availResourceId}
                  onChange={(e) => setAvailResourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                >
                  {availResourceType === 'ROOM'
                    ? rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_number} - {r.room_name || r.building}
                        </option>
                      ))
                    : labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.lab_code || l.lab_number} - {l.name}
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Day of Week</label>
                  <select
                    value={availDay}
                    onChange={(e) => setAvailDay(e.target.value as AcademicDay)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={availStart}
                    onChange={(e) => setAvailStart(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={availEnd}
                    onChange={(e) => setAvailEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Server Maintenance & Firmware Patching"
                  value={availReason}
                  onChange={(e) => setAvailReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityRuleModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-white shadow-lg"
                >
                  Apply Restriction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
