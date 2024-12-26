%lex
%options case-insensitive

%x string
%x md_string
%x title
%x acc_title
%x acc_descr
%x acc_descr_multiline
%s axis_data
%s axis_band_data
%s data
%s data_inner
%%

\%\%(?!\{)[^\n]*                          /* skip comments */
[^\}]\%\%[^\n]*                           /* skip comments */
<axis_data>(\r?\n)                        { this.popState(); return 'NEWLINE'; }
<data>(\r?\n)                             { this.popState(); return 'NEWLINE'; }
[\n\r]+                                   return 'NEWLINE';
\%\%[^\n]*                                /* do nothing */

"title"                                   { return 'title'; }

"accTitle"\s*":"\s*                         { this.pushState("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*              { this.popState(); return "acc_title_value"; }
"accDescr"\s*":"\s*                         { this.pushState("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*              { this.popState(); return "acc_descr_value"; }
"accDescr"\s*"{"\s*                         { this.pushState("acc_descr_multiline");}
<acc_descr_multiline>"{"                 { this.popState(); }
<acc_descr_multiline>[^\}]*               { return "acc_descr_multiline_value"; }

"radarchart"                              {return 'RADARCHART';}

"x-axis"                                  { this.pushState("axis_data"); return "X_AXIS"; }
"y-axis"                                  { this.pushState("axis_data"); return "Y_AXIS"; }
<axis_data>"["                            { this.pushState("axis_band_data"); return 'SQUARE_BRACES_START'; }
<axis_data>"-->"                          { return 'ARROW_DELIMITER'; }

"data"                                    { this.pushState("data"); return 'DATA'; }
<data>"["                                 { this.pushState("data_inner"); return 'SQUARE_BRACES_START'; }
<axis_data,data_inner>[+-]?(?:\d+(?:\.\d+)?|\.\d+)   { return 'NUMBER_WITH_DECIMAL'; }
<data_inner,axis_band_data>"]"            { this.popState(); return 'SQUARE_BRACES_END'; }

(?:"`)                                    { this.pushState("md_string"); }
<md_string>(?:(?!`\").)+                  { return "MD_STR"; }
<md_string>(?:`")                         { this.popState(); }
["]                                       this.pushState("string");
<string>["]                               this.popState();
<string>[^"]*                             return "STR";

"["                                       return 'SQUARE_BRACES_START'
"]"                                       return 'SQUARE_BRACES_END'
[A-Za-z]+                                 return 'ALPHA';
":"                                       return 'COLON';
\+                                        return 'PLUS';
","                                       return 'COMMA';
\=                                        return 'EQUALS';
"*"                                       return 'MULT';
\#                                        return 'BRKT';
[\_]                                      return 'UNDERSCORE';
"."                                       return 'DOT';
"&"                                       return 'AMP';
\-                                        return 'MINUS';
[0-9]+                                    return 'NUM';
\s+                                       /* skip */
";"                                       return 'SEMI';
<<EOF>>                                   return 'EOF';

/lex

%start start

%% /* language grammar */

start
  : eol start
  | RADARCHART chartConfig start
  | RADARCHART start
  | document
  ;

chartConfig
  : /* empty */
  ;

document
  : /* empty */
  | document statement
  ;

statement
  : statement eol
  | title text                                                  { /* set diagram title */ }
  | X_AXIS parseXAxis
  | Y_AXIS parseYAxis
  | DATA plotData                                               { /* set data */ }
  ;

plotData
  : SQUARE_BRACES_START commaSeparatedNumbers SQUARE_BRACES_END   { $$ = $commaSeparatedNumbers }
  ;

commaSeparatedNumbers
  : NUMBER_WITH_DECIMAL COMMA commaSeparatedNumbers                { $$ = [Number($NUMBER_WITH_DECIMAL), ...$commaSeparatedNumbers] }
  | NUMBER_WITH_DECIMAL                                           { $$ = [Number($NUMBER_WITH_DECIMAL)] }
  ;

parseXAxis
  : text                                                          { /* set x-axis title */ }
  | text xAxisData                                                { /* set x-axis title */ }
  | xAxisData                                                     { /* set x-axis title */ }
  ;

xAxisData
  : bandData                                                 { /* set x-axis band */ }
  | NUMBER_WITH_DECIMAL ARROW_DELIMITER NUMBER_WITH_DECIMAL  { /* set x-axis range data */ }
  ;

bandData
  : SQUARE_BRACES_START commaSeparatedTexts SQUARE_BRACES_END       { $$ = $commaSeparatedTexts }
  ;

commaSeparatedTexts
  : text COMMA commaSeparatedTexts                                 { $$ = [$text, ...$commaSeparatedTexts] }
  | text                                                          { $$ = [$text] }
  ;

parseYAxis
  : text                                                      { /* set y-axis title */ }
  | text yAxisData                                            { /* set y-axis title */ }
  | yAxisData                                                 { /* set y-axis title */ }
  ;

yAxisData
  : NUMBER_WITH_DECIMAL ARROW_DELIMITER NUMBER_WITH_DECIMAL  { /* set y-axis range data */ }
  ;

eol
  : NEWLINE
  | SEMI
  | EOF
  ;

text
  : alphaNum { $$ = { text: $alphaNum, type: 'text' }; }
  | STR { $$ = { text: $STR, type: 'text' }; }
  | MD_STR { $$ = { text: $MD_STR, type: 'markdown' }; }
  ;

alphaNum
  : alphaNumToken { $$ = $alphaNumToken; }
  | alphaNum alphaNumToken { $$ = $alphaNum + '' + $alphaNumToken; }
  ;

alphaNumToken
  : AMP
  | NUM
  | ALPHA
  | PLUS
  | EQUALS
  | MULT
  | DOT
  | BRKT
  | MINUS
  | UNDERSCORE
  ;

%%
