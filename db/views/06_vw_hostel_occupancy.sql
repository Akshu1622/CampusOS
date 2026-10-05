-- Object: vw_hostel_occupancy
-- Description: RP-6 Hostel occupancy by hostel
-- Choice: View
-- Reason: Aggregates across all hostels; no parameters needed.
-- Inputs: None
-- Output columns: hostel_id, hostel_name, gender_block, total_capacity, occupied_beds, available_beds, occupancy_pct
-- Query logic: Joins hostel and room, aggregates capacity and available beds, computes occupied beds and percentage.
-- SQL constructs: JOIN, GROUP BY

CREATE OR REPLACE VIEW vw_hostel_occupancy AS
SELECT 
    h.id AS hostel_id,
    h.name AS hostel_name,
    h.gender_block,
    SUM(r.bed_capacity) AS total_capacity,
    SUM(r.bed_capacity - r.available_beds) AS occupied_beds,
    SUM(r.available_beds) AS available_beds,
    ROUND((SUM(r.bed_capacity - r.available_beds) * 100.0) / NULLIF(SUM(r.bed_capacity), 0), 2) AS occupancy_pct
FROM hostel h
LEFT JOIN room r ON h.id = r.hostel_id
GROUP BY h.id, h.name, h.gender_block;
