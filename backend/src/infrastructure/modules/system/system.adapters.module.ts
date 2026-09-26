import { Module } from '@nestjs/common';
import { CLOCK_PROVIDER } from '@infrastructure/system/system-clock';
import { ID_GENERATOR_PROVIDER } from '@infrastructure/system/uuid-v7.generator';

const providers = [ID_GENERATOR_PROVIDER, CLOCK_PROVIDER];

/** Identificadores y hora: dependencias técnicas de los casos de uso. */
@Module({
  providers,
  exports: providers,
})
export class SystemAdaptersModule {}
