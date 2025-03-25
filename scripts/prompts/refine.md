Consume the word in the markdown file in the attachments.

Tweak each definition to a highschool reading level.

Format the word object in JSON like this:

```
{
"word": "word",
"meanings: [
"part of speech - definition1", "part of speech - definition2"]
}
```

The expected output should resemble the following example object but if there are multiple definitions include them all.

```
{
"word": "doek",
"meanings": [
"noun - A cloth.",
"noun - A kopdoek: a kerchief or bandanna worn as a head covering"
]
}
```

Return the object without additional text