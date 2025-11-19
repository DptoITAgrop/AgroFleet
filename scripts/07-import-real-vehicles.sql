-- Import real vehicle data from Agroptimum
-- This script adds all the actual vehicles from the company

-- First, let's add a company field to track which company owns each vehicle
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'AGROPTIMUM';

-- Insert all vehicles (cars, vans, trucks)
INSERT INTO vehicles (license_plate, brand, model, year, vehicle_type, status, company) VALUES
('0132LGH', 'TOYOTA', 'HILUX', 2020, 'truck', 'available', 'AGROPTIMUM'),
('0818MZN', 'AUDI', 'Q3', 2019, 'car', 'available', 'ACEMI'),
('1044NCG', 'FORD', 'TRANSIT CUSTOM', 2021, 'van', 'available', 'AGROPTIMUM'),
('1244NFC', 'FORD', 'TOURNEO COURIER', 2020, 'van', 'available', 'ACEMI'),
('1388KDM', 'CITROEN', 'BERLINGO', 2018, 'van', 'available', 'AGROPTIMUM'),
('1408MTY', 'AUDI', 'Q3', 2019, 'car', 'available', 'AGROPTIMUM'),
('1417MTY', 'AUDI', 'Q3', 2019, 'car', 'available', 'AGROPTIMUM'),
('1541NCD', 'DACIA', 'DUSTER', 2020, 'car', 'available', 'AGROPTIMUM'),
('1625JZX', 'CITROEN', 'BERLINGO', 2018, 'van', 'available', 'AGROPTIMUM'),
('2714MVD', 'KIA', 'SPORTAGE', 2022, 'car', 'available', 'AGROPTIMUM'),
('4181MRH', 'DACIA', 'DUSTER', 2021, 'car', 'available', 'AGROPTIMUM'),
('8819JWJ', 'DACIA', 'DUSTER', 2017, 'car', 'available', 'AGROPTIMUM'),
('4187HGN', 'SCANIA', 'R500', 2015, 'truck', 'available', 'AGROPTIMUM'),
('5452NDW', 'FORD', 'RANGER', 2023, 'truck', 'available', 'AGROPTIMUM'),
('6637MVZ', 'VOLKSWAGEN', 'CADDY', 2022, 'van', 'available', 'AGROPTIMUM'),
('6782MWC', 'VOLKSWAGEN', 'CADDY', 2022, 'van', 'available', 'AGROPTIMUM'),
('6795MWC', 'VOLKSWAGEN', 'CARAVELLE', 2022, 'van', 'available', 'AGROPTIMUM'),
('6819MVD', 'KIA', 'SPORTAGE', 2022, 'car', 'available', 'AGROPTIMUM'),
('6820MVD', 'KIA', 'SPORTAGE', 2022, 'car', 'available', 'AGROPTIMUM'),
('6822MVD', 'KIA', 'SPORTAGE', 2022, 'car', 'available', 'AGROPTIMUM'),
('8290LWY', 'AUDI', 'Q3', 2017, 'car', 'available', 'ACEMI'),
('7331LFJ', 'VOLVO', 'RIGIDO', 2016, 'truck', 'available', 'AGROPTIMUM'),
('7342MRG', 'DACIA', 'DUSTER', 2022, 'car', 'available', 'AGROPTIMUM')
ON CONFLICT (license_plate) DO NOTHING;

-- Insert tractors
INSERT INTO vehicles (license_plate, brand, model, year, vehicle_type, status, company) VALUES
('E0814BHV', 'KUBOTA', 'R10 TRV', 2014, 'tractor', 'available', 'AGROPTIMUM'),
('E1611BHG', 'JOHN DEERE', 'SERIE 3E', 2016, 'tractor', 'available', 'AGROPTIMUM'),
('E3679BBB', 'JOHN DEERE', '5500N', 2018, 'tractor', 'available', 'AGROPTIMUM'),
('E3918BHZ', 'FENDT', '211 VARIO', 2018, 'tractor', 'available', 'AGROPTIMUM'),
('E6262BHH', 'MERLO', 'TRACTOR', 2020, 'tractor', 'available', 'AGROPTIMUM'),
('E6513BHG', 'JOHN DEERE', 'SERIE 3E', 2020, 'tractor', 'available', 'AGROPTIMUM'),
('E8054BHT', 'KUBOTA', 'LX 351', 2021, 'tractor', 'available', 'AGROPTIMUM'),
('E8055BHT', 'KUBOTA', 'LX 351', 2021, 'tractor', 'available', 'AGROPTIMUM'),
('E8327BJC', 'FENDT', 'VARIO 211', 2021, 'tractor', 'available', 'AGROPTIMUM'),
('E8328BJC', 'FENDT', 'VARIO 314', 2021, 'tractor', 'available', 'AGROPTIMUM'),
('E9771BHT', 'FENDT', 'VARIO', 2022, 'tractor', 'available', 'AGROPTIMUM'),
('E9999BHD', 'FENDT', '211 STD', 2022, 'tractor', 'available', 'AGROPTIMUM')
ON CONFLICT (license_plate) DO NOTHING;

-- Insert trailers and machinery
INSERT INTO vehicles (license_plate, brand, model, year, vehicle_type, status, company) VALUES
('E1872BHV', 'CAMARA', 'REMOLQUE', 2016, 'trailer', 'available', 'AGROPTIMUM'),
('E7566BHX', 'GENERICO', 'REMOLQUE', 2020, 'trailer', 'available', 'AGROPTIMUM'),
('E8055BHX', 'GENERICO', 'REMOLQUE', 2021, 'trailer', 'available', 'AGROPTIMUM'),
('E2637BHM', 'GENERICO', 'ATOMIZADOR', 2017, 'machinery', 'available', 'AGROPTIMUM'),
('E2661BHM', 'AUSA', 'CARRETILLA T 204 H', 2017, 'machinery', 'available', 'AGROPTIMUM'),
('E7302BJC', 'HIDROMEX', '102B RETROEXCAVADORA', 2020, 'machinery', 'available', 'AGROPTIMUM'),
('R0514BDB', 'SCHMITZ', 'CARGOBULL', 2005, 'trailer', 'available', 'AGROPTIMUM'),
('R2972BBB', 'GENERICO', 'GÓNDOLA', 2008, 'trailer', 'available', 'AGROPTIMUM')
ON CONFLICT (license_plate) DO NOTHING;

-- Update the seed data script to reflect the new company column
COMMENT ON COLUMN vehicles.company IS 'Company that owns the vehicle (AGROPTIMUM, ACEMI, etc.)';
