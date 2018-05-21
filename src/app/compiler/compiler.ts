import { MinTermFragment } from "../shared/min.term.fragment";
import { McKluskeyResolver } from "../shared/mc.kluskey";
import { BehaviorSubject } from "rxjs";

export class Compiler  {
    mcKluskeyResolved$: BehaviorSubject<McKluskeyResolver> = new BehaviorSubject(null);
    mcKluskeyResolvedArray$: BehaviorSubject<Array<McKluskeyResolver>> = new BehaviorSubject(null);
    constructor() {
        this.mcKluskeyWatcher();
    }
    buildMcKluskeyFinalExpression( resolved ): String {
        if ( !resolved ) {
            resolved = this.mcKluskeyResolved$.getValue();
        }
        let father = resolved;
        let final = '';
        do {
            for( let fragment of father.fragments ) {
                if ( !fragment.wasSimplied ) {
                    let nothing = true;
                    final += '( '
                    for ( let variable of fragment.variables ) {
                        if ( variable != '-' ) {
                            nothing = false;
                            final += variable +'.'
                        }
                    }
                    if ( !nothing ) {
                        final = final.replace(/\.$/g, '');
                        final += ' ) + '
                    } else {
                        final = final.replace(/\( $/g, '');
                    }
                }
            }
            father = father.child;
        } while ( father )
        return this.simplifyMinTermsExpression( final.replace(/\+ $/g, ''));
    }
    mcKluskey( expression ) {
        let minTermsFragments: Array<MinTermFragment> = [];
        let index = 0;
        let expressionFragments = expression.split(' + ');
        for ( let expressionFragment of expressionFragments) {
            
            const minTermFragment = new MinTermFragment();
            expressionFragment = expressionFragment.replace(/\( | \)/g, '');

            for ( let fragment of expressionFragment.split('.') ) {
                minTermFragment.name = '['+ index +']'
                minTermFragment.values.push( ( fragment[0] === '!' ) ?  '0' : '1' );
                minTermFragment.variables.push( fragment );
            }
            minTermsFragments.push( minTermFragment );
            index++;
        }
        this.mcKluskeyResolved$.next( this.mcKluskeyResolver(minTermsFragments, 0 ));
    }
    mcKluskeyComparator( valuesOne, valuesTwo ) {
        let changed;
        for (let i = 0; i < valuesOne.length; i++) {
            let valueOne =  valuesOne[i];
            let valueTwo = valuesTwo[i];
            if ( valueOne != valueTwo ) {
                if ( changed != undefined ) {
                    return undefined;
                }
                else {
                    changed = i;
                }
            }
        }
        return changed;
    }
    mcKluskeyResolver( fragments, level ): McKluskeyResolver {
        const resolved = new McKluskeyResolver();
        const childFragments: Array<MinTermFragment> = [];
        let i = 0;

        resolved.fragments = fragments;
        resolved.level = level;
        while (i < fragments.length) {
            let fragmentOne: MinTermFragment = fragments[i];
            for (let j = i + 1; j < fragments.length; j++) {
                let fragmentTwo: MinTermFragment = fragments[j];
                let changedIndice =  this.mcKluskeyComparator( fragmentOne.values, fragmentTwo.values );
                if (changedIndice != undefined) {
                    const fragment = new MinTermFragment();
                    fragment.name = fragmentOne.name +" "+ fragmentTwo.name;
                    for ( let o = 0; o < fragmentOne.values.length; o++ ) {
                        fragment.values.push( fragmentOne.values[o] )   
                    }
                    for ( let o = 0; o < fragmentOne.variables.length; o++ ) {
                        fragment.variables.push( fragmentOne.variables[o] )   
                    }
                    fragment.values[changedIndice] = "-";
                    fragment.variables[changedIndice] = "-";
                    childFragments.push( fragment );
                    fragmentOne.wasSimplied = true;
                    fragmentTwo.wasSimplied = true;
                }
            }
            i++;
        }
        if ( childFragments.length > 0 ) {
            resolved.child = this.mcKluskeyResolver( childFragments, level +1 );
        }
        return resolved;
    }
    mcKluskeyWatcher() {
        this.mcKluskeyResolved$.subscribe(( mcKluskey: McKluskeyResolver ) => {
            if ( mcKluskey ) {
                let resolveds:Array<McKluskeyResolver> = [];
                let resolved:McKluskeyResolver = mcKluskey;
                while ( resolved ) {
                    resolveds.push( resolved );
                    resolved = resolved.child;
                }
                this.mcKluskeyResolvedArray$.next( resolveds );
            }
        })
    }
    simplifyMinTermsExpression( expression ) {
        if ( expression === '' )
            return '1';
        
        const fragments = expression.split("+");
        expression = "";
        for ( let i = 0; i < fragments.length; i++ ) {
            let fragmentParsed = fragments[i].replace(/(\( | \))/g, '');
            let clonesLenght = this.findAndRemoveClones( fragmentParsed, fragments, i );
            i-= clonesLenght;
            
            //indice = this.simplifyExpressionFindXOR( fragmentParsed, fragments, i );
        }
        for ( let fragment of fragments ) {
            expression+= fragment + " + "
        }
        return expression.replace(/\+ $/g, '');
    }
    findAndRemoveClones( fragment, fragments, start ) {
        let clones = [];
        for ( let i = start+1; i < fragments.length; i++ ) {
            let fragmentParsed = fragments[i].replace(/(\( | \))/g, '');
            if ( fragment === fragmentParsed ) {
                clones.push( i );
            }
        }
        clones.sort((a, b) => 1);
        for ( let i = 0; i < clones.length; i++ ) {
            fragments.splice( clones[i], 1 );
        }
        return clones.length;
    }
    simplifyExpressionFindXOR( fragment, fragments, start ) {
        if ( fragment.length % 2 == 0 ) {
            
        }
        for ( let i = start+1; i < fragments.length; i++ ) {
            let fragmentParsed = fragments[i].replace(/(\( | \))/g, '');
        }
    }
}