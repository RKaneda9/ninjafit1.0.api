# ninjafit1.0.api

## settings.json
this file must be included in root to setup mailer, facebook and instagram. It should have the following setup:
```json
{
    "facebook": {
      "pageId": "1702849776595679",
      "accessToken": "EAAHD6YVBlk12v89ds2y3po6l58v3lfgirhxpg7amgz0wym9lug4bylfor7jgqporzbstp6km8eusjiiy3hw9xahsk6snrv5zs0pkfgbwk5nk9saer"
    },
    "instagram": {
      "pageId": "ninjafitgym"
    },
    "mailer": {
      "fromAddress": "example@gmail.com",
      "fromPassword": "abcdefgh",
      "toAddress": ["emample1@gmail.com", "example2@gmail.com"]
    }
}
```