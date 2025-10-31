import { Module } from '@nestjs/common'
import { ShiftController } from './shift.controller'
import { ShiftService } from './shift.service'
import { DatabaseModule } from '../database/database.module'

@Module({
	imports: [DatabaseModule],
	controllers: [ShiftController],
	providers: [ShiftService]
})
export class ShiftModule {}

