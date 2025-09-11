import { Module } from '@nestjs/common';
import { ElasticsearchAppModule } from './elasticsearch';

@Module({
  imports: [ElasticsearchAppModule],
})
export class AppModule {}
