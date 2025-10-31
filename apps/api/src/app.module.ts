import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { TeamModule } from './team/team.module'
import { ShiftModule } from './shift/shift.module'
import { ClientModule } from './client/client.module'

@Module({
	imports: [DatabaseModule, AuthModule, UserModule, TeamModule, ShiftModule, ClientModule],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}

