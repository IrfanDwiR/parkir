const STORAGE_KEY = 'parkirku_parking_data';

const INITIAL_DATA = {
  settings: {
    rates: { motor: 2000, mobil: 5000 },
    capacity: { motor: 20, mobil: 20 }
  },
  active: [],
  transactions: []
};

function readData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  return JSON.parse(saved);
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getParkingData() {
  return readData();
}

export function getSlotCounts(data, type) {
  const occupied = data.active.filter(vehicle => vehicle.type === type).length;
  const capacity = data.settings.capacity[type];
  return { occupied, capacity, available: Math.max(0, capacity - occupied) };
}

export function registerEntry(plate, type) {
  const cleanPlate = plate.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!cleanPlate) throw new Error('Nomor kendaraan wajib diisi.');
  if (!['motor', 'mobil'].includes(type)) throw new Error('Jenis kendaraan tidak valid.');

  const data = readData();
  if (data.active.some(vehicle => vehicle.plate === cleanPlate)) {
    throw new Error('Kendaraan ini masih tercatat berada di area parkir.');
  }
  const slots = getSlotCounts(data, type);
  if (slots.available === 0) throw new Error(`Slot ${type} penuh.`);

  const now = new Date();
  const ticket = `PK-${now.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const prefix = type === 'motor' ? 'M' : 'C';
  const occupiedSlots = new Set(data.active.filter(vehicle => vehicle.type === type).map(vehicle => vehicle.slot));
  let slotNumber = 1;
  while (occupiedSlots.has(`${prefix}-${String(slotNumber).padStart(2, '0')}`)) slotNumber += 1;
  const vehicle = {
    ticket,
    plate: cleanPlate,
    type,
    slot: `${prefix}-${String(slotNumber).padStart(2, '0')}`,
    enteredAt: now.toISOString()
  };
  data.active.push(vehicle);
  saveData(data);
  return vehicle;
}

export function findActiveVehicle(query) {
  const cleanQuery = query.trim().toUpperCase();
  if (!cleanQuery) return null;
  return readData().active.find(vehicle =>
    vehicle.ticket.toUpperCase() === cleanQuery || vehicle.plate === cleanQuery
  ) || null;
}

export function calculateFee(vehicle, rates, now = Date.now()) {
  const durationMs = Math.max(0, now - new Date(vehicle.enteredAt).getTime());
  const hours = Math.max(1, Math.ceil(durationMs / (60 * 60 * 1000)));
  return { hours, amount: hours * rates[vehicle.type] };
}

export function completeExit(ticket, paymentMethod) {
  const data = readData();
  const index = data.active.findIndex(vehicle => vehicle.ticket === ticket);
  if (index < 0) throw new Error('Karcis tidak ditemukan atau transaksi sudah selesai.');
  if (!['Tunai', 'QRIS'].includes(paymentMethod)) throw new Error('Metode pembayaran tidak valid.');

  const vehicle = data.active[index];
  const exitedAt = new Date().toISOString();
  const fee = calculateFee(vehicle, data.settings.rates, new Date(exitedAt).getTime());
  const transaction = { ...vehicle, exitedAt, hours: fee.hours, amount: fee.amount, paymentMethod };
  data.active.splice(index, 1);
  data.transactions.unshift(transaction);
  saveData(data);
  return transaction;
}

export function updateParkingSettings(rates, capacity) {
  const data = readData();
  for (const type of ['motor', 'mobil']) {
    if (!Number.isInteger(rates[type]) || rates[type] < 1) {
      throw new Error('Tarif harus berupa angka minimal Rp1.');
    }
    if (!Number.isInteger(capacity[type]) || capacity[type] < 1) {
      throw new Error('Kapasitas slot harus berupa angka minimal 1.');
    }
    if (capacity[type] < getSlotCounts(data, type).occupied) {
      throw new Error(`Kapasitas ${type} tidak boleh lebih kecil dari slot yang sedang terisi.`);
    }
  }
  data.settings = { rates, capacity };
  saveData(data);
}
