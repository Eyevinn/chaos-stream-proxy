import dashSegmentHandler from './segment';

describe('dashSegmentHandler', () => {
  it('handles when a representationId contains underscore', async () => {
    const result = await dashSegmentHandler({
      queryStringParameters: {
        url: 'https://stream.with_underscore.com/live-$RepresentationID$-$Time$.dash'
      },
      path: '/segment_82008145102133_123_audio_track_0_0_nor=128000_128000',
      requestContext: {
        elb: { targetGroupArn: '' }
      },
      isBase64Encoded: false,
      httpMethod: 'GET',
      body: '',
      headers: {}
    });
    expect(result.headers.Location).toBe(
      'https://stream.with_underscore.com/live-audio_track_0_0_nor=128000_128000-82008145102133.dash'
    );
  });
});
