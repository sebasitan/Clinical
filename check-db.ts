
import mongoose from 'mongoose';
import { PatientModel, ConsultationModel } from './lib/models';
import dbConnect from './lib/db';

async function check() {
    try {
        await dbConnect();
        const pCount = await PatientModel.countDocuments();
        const cCount = await ConsultationModel.countDocuments();
        const uniqueICs = await ConsultationModel.distinct('patientIC');

        console.log('--- DATABASE STATUS ---');
        console.log('Patient records:', pCount);
        console.log('Consultation records:', cCount);
        console.log('Unique ICs in Consultations:', uniqueICs.length);

        if (pCount === 0 && uniqueICs.length > 0) {
            console.log('CONFIRMED: Patients exist only in consultations.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
