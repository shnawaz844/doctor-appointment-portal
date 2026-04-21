-- SQL script to add fee and emergency_fee columns to the doctors table
ALTER TABLE doctors 
ADD COLUMN fee NUMERIC DEFAULT 0,
ADD COLUMN emergency_fee NUMERIC DEFAULT 0;
